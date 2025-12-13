const bg = document.createElement("div")
bg.id = "bg"
bg.style.position = "fixed"
bg.style.inset = 0
bg.style.zIndex = -100
document.body.appendChild(bg)

const setDynamicBackground = (theme) => {
    bg.childNodes.forEach((child) => bg.removeChild(child))
    const color = {
        "light": "#808080",
        "dark": "#C0C0C0",
    }[theme]

    particlesJS(bg.id, {
        "particles": {
            "number": {
                "value": 50,
                "density": {
                    "enable": true,
                    "value_area": 800
                }
            },
            "color": {
                "value": `${color}`
            },
            "shape": {
                "type": "circle",
                "stroke": {
                    "width": 0,
                    "color": `${color}`
                },
                "polygon": {
                    "nb_sides": 5
                }
            },
            "opacity": {
                "value": 0.5,
                "random": false,
                "anim": {
                    "enable": false,
                    "speed": 1,
                    "opacity_min": 0.1,
                    "sync": false
                }
            },
            "size": {
                "value": 3,
                "random": true,
                "anim": {
                    "enable": false,
                    "speed": 40,
                    "size_min": 0.1,
                    "sync": false
                }
            },
            "line_linked": {
                "enable": true,
                "distance": 150,
                "color": `${color}`,
                "opacity": 0.4,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 1,
                "direction": "none",
                "random": true,
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": {
                    "enable": false,
                    "rotateX": 600,
                    "rotateY": 1200
                }
            }
        },
        "retina_detect": true
    })
}

setDynamicBackground(document.documentElement.dataset.theme)
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
            setDynamicBackground(mutation.target.getAttribute(mutation.attributeName))
        }
    })
})
observer.observe(document.documentElement, { attributes: true })
