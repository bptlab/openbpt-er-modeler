# How to add extra icons

- Go to https://fontello.com/
- Load all of the svg files in the `raw` directory
- Load any new icon as svg (store it in the `raw` directory for future users)
- Select the custom icons and the `key` icon from `Elusive` font
- In the `Customize Names` tab, delete the er prefix (e.g. icon-er-place -> icon-place)
- In the `Customize Codes` tab, the codes can be changed (not strictly necessary)
- Change font name in the input field to `er`
- And in the setting next to it change the CSS prefix to `er-icon`
- Download the webfont and replace all the `config.json` file and all files in the `font` and `css` directories
- Delete auto-generated margins in the `css/er.css` and `css/er-embedded.css` files
