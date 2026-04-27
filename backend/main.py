import os
from contextlib import asynccontextmanager

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ml.routes import router as ml_router


load_dotenv()

cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:3000")
API_HOST = os.getenv("API_HOST", "0.0.0.0")

try:
	API_PORT = int(os.getenv("API_PORT", "8000"))
except ValueError:
	API_PORT = 8000


@asynccontextmanager
async def lifespan(app: FastAPI):
	# Place startup initialization here when needed.
	yield
	# Place shutdown cleanup here when needed.


def create_app() -> FastAPI:
	app = FastAPI(
		title="Loan Risk Profiling API",
		lifespan=lifespan,
	)

	app.add_middleware(
		CORSMiddleware,
		allow_origins=[cors_origin],
		allow_credentials=True,
		allow_methods=["*"],
		allow_headers=["*"],
	)

	@app.get("/")
	async def root() -> dict[str, str]:
		return {"status": "ok", "message": "Loan Risk Profiling API"}

	app.include_router(ml_router)
	return app


app = create_app()


if __name__ == "__main__":
	uvicorn.run(app, host=API_HOST, port=API_PORT)
