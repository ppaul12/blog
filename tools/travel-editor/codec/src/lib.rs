use little_exif::{
    exif_tag::ExifTag, filetype::FileExtension, ifd::ExifTagGroup, metadata::Metadata,
    rational::{iR64, uR64},
};
use serde_json::Value;
use std::cell::RefCell;

thread_local! {
    static INPUT: RefCell<[Vec<u8>; 2]> = RefCell::new([Vec::new(), Vec::new()]);
    static OUTPUT: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) };
}

// The worker copies both inputs into these buffers and copies the result out before its next call.
#[no_mangle]
pub extern "C" fn prepare(index: usize, length: usize) -> *mut u8 {
    INPUT.with(|cell| {
        let mut input = cell.borrow_mut();
        input[index].resize(length, 0);
        input[index].as_mut_ptr()
    })
}

#[no_mangle]
pub extern "C" fn result_ptr() -> *const u8 {
    OUTPUT.with(|cell| cell.borrow().as_ptr())
}

#[no_mangle]
pub extern "C" fn result_len() -> usize {
    OUTPUT.with(|cell| cell.borrow().len())
}

fn degrees(value: f64) -> Vec<uR64> {
    let total = (value.abs() * 3_600_000_000.0).round() as u64;
    vec![
        uR64::from((total / 3_600_000_000) as f64),
        uR64::from((total / 60_000_000 % 60) as f64),
        uR64::from((total % 60_000_000) as f64 / 1_000_000.0),
    ]
}

fn apply_changes(metadata: &mut Metadata, changes: &Value) -> Result<(), String> {
    macro_rules! replace {
        ($key:literal, $id:literal, $group:ident, $tag:ident, $parse:expr) => {
            if let Some(value) = changes.get($key) {
                metadata.remove_tag_by_hex_group($id, ExifTagGroup::$group);
                if !value.is_null() {
                    let parsed = ($parse)(value).ok_or(concat!("Invalid EXIF field: ", $key))?;
                    metadata.set_tag(ExifTag::$tag(parsed));
                }
            }
        };
    }
    let text = |value: &Value| value.as_str().filter(|text| !text.contains('\0')).map(str::to_owned);
    let unsigned = |value: &Value| value.as_f64().filter(|value| (1e-9..=1e9).contains(value))
        .map(|value| vec![uR64::from(value)]);
    let short = |value: &Value| u16::try_from(value.as_u64()?).ok().map(|value| vec![value]);
    let signed = |value: &Value| value.as_f64().filter(|value| value.abs() <= 1e9)
        .map(|value| vec![if value == 0.0 { iR64 { nominator: 0, denominator: 1 } } else { iR64::from(value) }]);

    replace!("camera", 0x0110, GENERIC, Model, text);
    replace!("lens", 0xa434, EXIF, LensModel, text);
    replace!("aperture", 0x829d, EXIF, FNumber, unsigned);
    replace!("shutter", 0x829a, EXIF, ExposureTime, unsigned);
    replace!("iso", 0x8827, EXIF, ISO, short);
    replace!("focalLength", 0x920a, EXIF, FocalLength, unsigned);
    replace!("exposureBias", 0x9204, EXIF, ExposureCompensation, signed);
    replace!("metering", 0x9207, EXIF, MeteringMode, short);

    if let Some(time) = changes.get("time") {
        metadata.remove_tag_by_hex_group(0x9003, ExifTagGroup::EXIF);
        metadata.remove_tag_by_hex_group(0x9291, ExifTagGroup::EXIF);
        if let Some(time) = time.as_str() {
            metadata.set_tag(ExifTag::DateTimeOriginal(time.to_owned()));
        }
    }
    if let Some(offset) = changes.get("offset") {
        metadata.remove_tag_by_hex_group(0x9011, ExifTagGroup::EXIF);
        if let Some(offset) = offset.as_str() {
            metadata.set_tag(ExifTag::OffsetTimeOriginal(offset.to_owned()));
        }
    }
    if let Some(location) = changes.get("location") {
        for tag in 0..=31 {
            metadata.remove_tag_by_hex_group(tag, ExifTagGroup::GPS);
        }
        if let Some(point) = location.as_array() {
            let [lat, lon] = point.as_slice() else { return Err("Expected a coordinate pair.".into()); };
            let lat = lat.as_f64().ok_or("Invalid latitude.")?;
            let lon = lon.as_f64().ok_or("Invalid longitude.")?;
            if lat.abs() > 90.0 || lon.abs() > 180.0 {
                return Err("Coordinates are outside the supported range.".into());
            }
            metadata.set_tag(ExifTag::GPSVersionID(vec![2, 3, 0, 0]));
            metadata.set_tag(ExifTag::GPSLatitudeRef(if lat < 0.0 { "S" } else { "N" }.into()));
            metadata.set_tag(ExifTag::GPSLongitudeRef(if lon < 0.0 { "W" } else { "E" }.into()));
            metadata.set_tag(ExifTag::GPSLatitude(degrees(lat)));
            metadata.set_tag(ExifTag::GPSLongitude(degrees(lon)));
        }
    }
    Ok(())
}

fn edit_bytes(image: &mut Vec<u8>, settings: &[u8], jpeg: bool) -> Result<Vec<u8>, String> {
    let changes = serde_json::from_slice(settings).map_err(|error| error.to_string())?;
    let mut metadata = if image.is_empty() {
        Metadata::new()
    } else {
        let format = if jpeg { FileExtension::JPEG } else { FileExtension::TIFF };
        Metadata::new_from_vec(image, format).map_err(|error| error.to_string())?
    };
    apply_changes(&mut metadata, &changes)?;
    if jpeg {
        metadata.write_to_vec(image, FileExtension::JPEG).map_err(|error| error.to_string())?;
        Ok(std::mem::take(image))
    } else {
        metadata.as_u8_vec(FileExtension::HEIF).map_err(|error| error.to_string())
    }
}

#[no_mangle]
pub extern "C" fn edit(jpeg: bool) -> bool {
    let result = INPUT.with(|cell| {
        let [image, settings] = &mut *cell.borrow_mut();
        edit_bytes(image, settings, jpeg)
    });
    let (success, bytes) = match result {
        Ok(bytes) => (true, bytes),
        Err(message) => (false, message.into_bytes()),
    };
    OUTPUT.with(|cell| cell.replace(bytes));
    success
}
