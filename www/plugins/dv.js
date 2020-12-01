// Returns a promise which should resolve when rendering has finished
// The render step should NOT make any network requests, because we might be offline!
export const render = async (el, config, [data, basemapPNG]) => {
    ReactDOM.render(el, )
}

export const load = async () => {
    const plugin = await import('/dv/dist/lib.module.js')
    console.log(plugin)
    
    return {
        render
    }
}

// Returns a query object which loads all required data, or an array of queries and raw http requests
// Maybe these should be detected when doing a single render pass of the plugin?
export const getDataDependencies = config => ([
    {
        me: {
            resource: 'me'
        }
    },
    'https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/7/59/60.png'
])