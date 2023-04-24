import express, { Router }  from 'express';
import { engine } from 'express-handlebars';

const router = Router();

async function startExpressServer() {
    const app = express();
  
    app.engine("hbs",
        engine({
            extname: "hbs",
            defaultLayout: false
        })
    );
    app.set('trust proxy', 1);
    app.set("view engine", "hbs");    
    app.set('views','./src/views');
    app.disable('x-powered-by');

    router.get('/', function(req, res) {
        res.render('index')
    });

    app.use('/public', express.static('src/public'));
    app.use('/', router);


    return app.listen(9000, err => {
        console.log(`[ + ] The server is running.`);
    });
}
  
let server = await startExpressServer();
export { server }
