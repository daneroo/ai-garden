import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export async function getRouter() {
  const router = createRouter({
    routeTree,
  })

  return router
}
