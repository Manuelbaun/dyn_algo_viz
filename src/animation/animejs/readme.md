# Animejs library

the animejs library was modified at two positions to make animtion continue, once a new animation is added to a timeline

* Method `contine()` 
* `tl.add()`, got a shouldReset param. if false it does not reset, when a new animation is added. When left `undefined` or `true` it defaults to the default behavoir.