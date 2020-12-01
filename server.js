var http = require('http')
var fs = require('fs')
var path = require('path')

http.createServer(function (request, response) {
    if (!request.url) {
        return
    }
    const url = String(request.url)
    let fsPath = `.${url}`

    console.log(url)
    
    if (fs.existsSync(fsPath) && fs.statSync(fsPath).isDirectory()) {
        if (!url.endsWith('/')) {
            response.writeHead(302, {
                'Location': url + '/'
            });
            response.end();
            return
        }
        fsPath = path.join(fsPath, 'index.html')
    }

    if (!fs.existsSync(fsPath)) {
        response.writeHead(404)
        response.end('Not Found')
        return
    }
    
    if (url.endsWith('.js')) {
        response.setHeader("Content-Type", "text/javascript");
    }

    if (url.endsWith('.html')) {
        response.setHeader("Content-Type", "text/html");
    }
        
    response.writeHead(200)
    response.end(fs.readFileSync(fsPath))
}).listen(8000)