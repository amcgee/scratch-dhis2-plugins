const { createElement, useState, useRef, useEffect } = React;
const render = ReactDOM.render;
const html = htm.bind(createElement);

function Counter() {
    const [count, setCount] = useState(0)

    return html`<button onClick=${() => setCount(c => c+1)}>${count}</button>`
}
function App() {
    return html`
        <${Counter} />
    `;
}

render(html`<${App}/>`, document.getElementById("target"));