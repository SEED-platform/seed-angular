FROM node:22
WORKDIR /app 
COPY . .
RUN npm install -g pnpm && pnpm install
EXPOSE 4200
CMD ["pnpm", "start"]