import { ConfigProvider } from './pkg/app-service-config.js'
import { useDataEngine } from './pkg/app-service-data.js'
import { DataProvider } from './pkg/app-service-data.js'

const { createElement, useState, useRef, useEffect } = React;
const render = ReactDOM.render;
const html = htm.bind(createElement);

const loadPlugin = async (engine, type, config) => {
    const pluginLoader = await import(`./plugins/${type}.js`)
    return await pluginLoader.load(engine, config)
}
function Plugin({ type, config }) {
    const engine = useDataEngine()
    const ref = useRef()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(undefined)

    useEffect(() => {
        setLoading(true)
        let canceled = false
        loadPlugin(engine, type, config).then(async (plugin) => {
            if (canceled) return;
            setError('rendering...')
            await plugin.render(ref.current)
            if (canceled) return;
            setError(undefined)
            setLoading(false)
        }).catch(e => {
            setLoading(false)
            setError('Failed to load plugin: ' + e)
            throw e
        })
        return () => { canceled = true }
    }, [type])
    return html`
        <div ref=${ref} />
        ${loading && '...'}
        ${error || null}
    `
}

function App() {
    const config = {
        baseUrl: 'https://debug.dhis2.org/2.35.0',
        apiVersion: 35
    }

    return html`
    <${ConfigProvider} config=${config} >
        <${DataProvider} >
            <${Plugin} type="react" />
        </${DataProvider}>
    </${ConfigProvider}>
    `;
}

render(html`<${App}/>`, document.getElementById("target"));