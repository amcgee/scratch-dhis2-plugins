const { useEffect } = React

export default ({ config, data, onLoaded }) => {
    useEffect(() => {
        console.log('rendering additional things...')
        setTimeout(onLoaded, 1000)
    }, [])
    console.log('render')
    return <h1>Hello {data.me.displayName}</h1>
}