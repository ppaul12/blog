// init toc
function initToc(object, target) {
    window.addEventListener("load", () => {
        // generate toc
        let prevTag = "", currTag = "", tagStack = new Array()
        const text = Array.from(object.querySelectorAll(target)).reduce((toc, header) => {
            currTag = header.tagName
            if (currTag > prevTag) { // h1 -> h2, h2 -> h3
                toc += `<ul><li><a href="#${header.id}">${header.id}</a>`
                tagStack.push("</ul>")
                tagStack.push("</li>")
            } else if (currTag == prevTag) { // h1 -> h1, h2 -> h2, h3 -> h3
                toc += tagStack.pop() // </li>
                toc += `<li><a href="#${header.id}">${header.id}</a>`
                tagStack.push("</li>")
            } else { // h3 -> h2, h3 -> h1, h2 -> h1
                toc += tagStack.pop() // </li>
                for (let i = 0; i < (prevTag[1] - currTag[1]); i++) {
                    toc += tagStack.pop() // </ul>
                    toc += tagStack.pop() // </li>
                }
                toc += `<li><a href="#${header.id}">${header.id}</a>`
                tagStack.push("</li>")
            }
            prevTag = currTag
            return toc
        }, "") + tagStack.reduce((a, b) => a + b, "")
        // append text to dialog
        if (text.length > 0) {
            let toc = document.createElement("div")
            toc.className = "tree-list"
            toc.innerHTML = "TOC" + text
            document.querySelector("#toc-box > article").appendChild(toc)
            // add a sidebar button
            let button = document.createElement("button")
            button.className = "contrast faa-parent animated-hover"
            button.setAttribute("data-target", "toc-box")
            button.onclick = toggleModal
            button.innerHTML = `<i class="fa-solid fa-bars-staggered faa-shake faa-slow"></i>`
            document.querySelector(".button-box").appendChild(button)
        }
    })
}
