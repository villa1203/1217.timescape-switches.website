export default defineEventHandler(async (event) => {

    const email = process.env.API_AUTH_EMAIL
    const password = process.env.API_AUTH_PASSWORD

    const authHeader = Buffer.from(`${email}:${password}`).toString('base64')

    const body = await readBody(event)

    const dataApi = await $fetch(`${useRuntimeConfig().public.apiBase}/api/query`, {
        lazy: true,
        method: 'POST',
        headers: {
            'Authorization': `Basic ${authHeader}`
        },
        body,
    })

    return dataApi
})


