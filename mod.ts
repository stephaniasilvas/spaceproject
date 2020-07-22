import api from "./api.ts";
import { log, Application, send } from "./deps.ts";

const app = new Application();
const PORT = 3000;

await log.setup({
    handlers: {
      console: new log.handlers.ConsoleHandler("INFO"),
    },
    loggers: {
      default: {
        level: "INFO",
        handlers: ["console"],
      },
    },
  });
  

app.addEventListener("error", (event) => {
    log.error(event.error);
});


// error handling

app.use(async(ctx, next) =>{
    try{
        await next();
    } catch(err){
    
        ctx.response.body="Internal server error";
        throw err;
    }
    
});

app.use(async(ctx, next) => {
    await next();
    const time = ctx.response.headers.get("X-Response-Time")
    log.info(`${ctx.request.method} ${ctx.request.url}: ${time}`);
});


app.use(async(ctx, next) => {
    const start = Date.now();
    await next();
    const delta = Date.now() - start;
    ctx.response.headers.set("X-Response-Time", `${delta}ms`);
});

app.use(api.routes());
app.use(api.allowedMethods());

app.use(async(ctx) => {
    const filePath = ctx.request.url.pathname;
    const fileWhitelist = [ 
        "/index.html",
        "/javascripts/script.js",
        "/stylesheets/style.css",
        "/images/flavicon.png",
        "/videos/space.mp4",
    ];
// importan for security reasons
    if (fileWhitelist.includes(filePath)){
        await send(ctx, filePath, {
            root: `${Deno.cwd()}/public`, 
        });
    }
    
});


    
if (import.meta.main){
    log.info(`Starting server on port ${PORT}...`);
    await app.listen({
        port: PORT
    });  
}

