# pinkievisor-query

An userscript for Greasemonkey to enable pinkievisor popups on Tabun

## Notice

As of July 2022, Pinkievisor service is no more functional, and its functionality is integrated into Tabun.

So this script is no more working and never will be, as well as things it offers are already implemented in Tabun engine.

Although this repository is left for historical purposes.

## Description (when Pinkievisor was working)

Could be used to ease getting post and comment stats from [Pinkievisor](https://pinkievisor.info) for [Tabun](https://tabun.everypony.ru) posts and comments.

Once script is installed, you may click a little Pinkie's head in post header or comment info block, to get pinkievisor stats for this comment or post.

Stats will appear in pop-up "window". It can be closed by clicking anywhere except this window.

Window could be moved by dragging its caption, and resized by dragging a little pink triangle in its bottom right corner.

New size of window is saved in localStorage, so you may set the size you feel nice for your screen.

## Planned (but cancelled) todos

* Fix empty window issue as promised [here](https://tabun.everypony.ru/blog/computers/198656.html#comment13371367)
* Use picture from [here](https://tabun.everypony.ru/blog/computers/194357.html#comment13194782)
* Enable open by hover instead of click as proposed [here](https://tabun.everypony.ru/blog/computers/194357.html#comment13194533)
* Move to `GM` method of fetching instead of `fetch()` to avoid CORS errors
