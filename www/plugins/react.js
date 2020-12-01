import { fetchDataDependencies } from './_fetchDataDependencies.js';

const { createElement } = React;
const html = htm.bind(createElement);

// Returns a query object which loads all required data, or an array of queries and raw http requests
// Maybe these should be detected when doing a single render pass of the plugin?
const getDataDependencies = () => ([
    {
        me: {
            resource: 'me'
        }
    },
    
    'https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/7/59/60.png',
])

export const load = async (engine, config) => {
    const [plugin, data] = await Promise.all([
        import('/plugins/react/dist/lib.modern.js'),
        fetchDataDependencies(engine, getDataDependencies(config))
    ])

    const { default: Plugin } = plugin

    return {
        // Shouldn't make any http requests
        render: (el) => {
            return new Promise(resolve => {
                const loaded = () => {
                    console.log('loaded')
                    resolve()
                }
                ReactDOM.render(html`<${Plugin} data=${data[0]} onLoaded=${loaded}/>`, el)
            })
        }
    }
}