---
---

getViewMode = () ->
    mode = window.localStorage.getItem("is-incognito")
    if mode? then return mode

    url = new URL(document.location)
    mode = if url.searchParams.get("incognito")? then "true" else "false"

    window.localStorage.setItem("is-incognito", mode)
    mode

if getViewMode() == "true"
    window.goatcounter =
        no_onload: true

window.addEventListener("load", (e) ->
    pageView = document.getElementById("page-view")
    fetch("https://peng-ao.goatcounter.com/counter/#{encodeURIComponent(location.pathname)}.json")
        .then (response) -> response.json()
        .then (data) ->
            pageView?.setAttribute("data-tooltip", "#{data.count} views")
        .catch (error) ->
            pageView?.setAttribute("data-tooltip", "1 view")
    
    siteView = document.getElementById("site-view")
    fetch("https://peng-ao.goatcounter.com/counter/TOTAL.json")
        .then (response) -> response.json()
        .then (data) ->
            siteView?.innerText = "#{data.count} views in total"
        .catch (error) ->
            siteView?.innerText = "1 view in total"
    return
)
