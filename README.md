<div align=center>

# bots.gg Widget

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Snazzah/botsgg-widget)

Create a widget from a bot in bots.gg. Formerly from SnazzahAPI.

![](https://botsgg.snazzah.dev/widget/272937604339466240/default.svg?w=400)

![](https://botsgg.snazzah.dev/widget/272937604339466240/banner.svg?w=400)

![](https://botsgg.snazzah.dev/badge/272937604339466240/servers)

</div>


## Usage

Simply use `https://botsgg.snazzah.dev/widget/<client_id>/default.svg` as an image URL and it will generate a nice widget.

### Widget Types
Currently there are two widget types: `default` and `banner` as shown above. You can replace the end of the url with `<type>.svg` to change it.

### Custom Width
You can change the width of the widget using `w` in a query string. (ex. `?w=500` for 500 pixels)

### Badges

You can also use badges with `https://botsgg.snazzah.dev/badge/<client_id>/servers`. The available badge types are `servers`, `library`, and `status`. You can use the query parameters as listed in [the Shields.io documentation](https://shields.io/badges/endpoint-badge#:~:text=Query%20Parameters) except `logo`, `url`, `cacheSeconds`, and `link`.

## Attribution

Made by [Snazzah](https://snazzah.com) under the [MIT](/LICENSE) license.