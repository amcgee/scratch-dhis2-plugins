const fetchDependency = async (engine, dependency) => {
    if (typeof dependency === 'string') { // TODO: support RequestInfo objects
        return await fetch(dependency)
    } else {
        return await engine.query(dependency)
    }
}
export const fetchDataDependencies = async (engine, dependencies) => {
    if (Array.isArray(dependencies)) {
        return await Promise.all(dependencies.map(dep => fetchDependency(engine, dep)))
    } else {
        return await fetchDependency(engine, dep)
    }
}