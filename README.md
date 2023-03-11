
# How to develop

Run the frontend
```bash
:frontend$ yarn install
:frontend$ yarn dev
```
Do not terminate this process.

In another terminal, run the backend (in a environment with the required packages)
```bash
:$ python manage.py runserver
```
And go to the page
`http://127.0.0.1:8000/chess`

You can also open up a shell for testing
```bash
:$ python manage.py shell
```

![frontend demo](/frontend_demo.gif)
