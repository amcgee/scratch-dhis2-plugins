import { fetchDataDependencies } from './_fetchDataDependencies';ç

const { createElement } = React;
const html = htm.bind(createElement);

// Returns a query object which loads all required data, or an array of queries and raw http requests
// Maybe these should be detected when doing a single render pass of the plugin?
const getDataDependencies = config => ([
    {
        me: {
            resource: 'me'
        }
    },
    'https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/7/59/60.png'
])

const render = async (Plugin, el) => 
    new Promise(resolve => {
        const complete = () => {
            console.log('complete')
            resolve()
        }
        ReactDOM.render(html`<${Plugin} data=${data[0]} onComplete=${complete}/>`, el)
    })

export const load = async (engine, config) => {
    const [plugin, data] = await Promise.all([
        import('/plugins/react/dist/lib.modern.js'),
        fetchDataDependencies(engine, getDataDependencies(config))
    ])

    const { default: Plugin } = plugin

    return {
        render: render.bind(undefined, Plugin)
    }
}