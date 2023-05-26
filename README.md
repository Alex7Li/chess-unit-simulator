# Chess Unit Simulator

It's a browser game in which you can create chess units and simulate playing them against each other. Create custom moves with block programming, combine them to create a piece, combine pieces to create board setups, and then play those games with other players online!

Currently still in active development, there's a lot of stuff to make!

## How to develop

Run the frontend from the frontend directory

```bash
frontend$ yarn install
frontend$ yarn dev
```

Run the code converting server from this directory as well. Even though it's in the frontend folder, it's secretly part of the backend.

```bash
frontend$ npx tsx watch convert_code_server.ts
```

Do not terminate this process.

In another terminal, setup the redis server and then run the backend (in a environment with the required packages)

```bash
docker run -p 6379:6379 -d redis:5
python manage.py runserver
```


And go to the page `http://127.0.0.1:8000/chess`, now you can play.

You can also open up a shell for testing

```bash
python manage.py shell
```

![frontend demo](/frontend_demo.gif)
(demo is quite outdated)
