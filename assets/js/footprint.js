const initTabView = (container, controller) => {
    controller.querySelectorAll("button").forEach((button) => {
        button.onclick = (event) => {
            const toClose = {
                map: container.querySelector(".travel-map[active]"),
                btn: controller.querySelector("button[active]"),
            }
            toClose.map.removeAttribute("active")
            toClose.btn.removeAttribute("active")

            const toOpen = {
                map: container.querySelector(event.target.getAttribute("data-target")),
                btn: event.target,
            }
            toOpen.map.setAttribute("active", "")
            toOpen.btn.setAttribute("active", "")
        }
    })
}
