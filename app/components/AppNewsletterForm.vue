<template>
    <section class="app-newsletter-form">
        <h3 class="app-newsletter-form__title">
            <lazy-sticker-paragraph
                :text="props.title"
                :inverted="true"
            />
        </h3>

        <form class="app-newsletter-form__form"
              v-if="!isSuccess" @submit.prevent="handleSubmit"
        >
            <label class="app-newsletter-form__form__label">

                <transition name="app-newsletter-transition">
                    <span class="app-newsletter-form__form__label__mail-info"
                          v-if="email.length > 0"
                    >{{ props.label }}</span>
                </transition>

                <input
                    v-model="email"
                    type="email"
                    name="email"
                    autocomplete="email"
                    required
                    :placeholder="props.placeholder"
                    :disabled="isSubmitting"
                >
            </label>

            <button type="submit" :disabled="isSubmitting">
                {{ isSubmitting ? props.submittingLabel : props.submitLabel }}
            </button>
        </form>

        <p class="app-newsletter-form__msg"
           v-if="message" role="status" aria-live="polite"
        >
            {{ message }}
        </p>

    </section>
</template>

<style lang="scss" scoped >
/* sticker "blob" effect — purple inner glow fading from the pill edge to the
   centre, tuned to read like the outer colored blob of the StickerParagraph
   stickers (same primary purple, soft falloff). */

.app-newsletter-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    border-radius: 1rem;
    gap: 1rem;
    /* Sit clear of the content block above it and breathe before the footer. */
    margin-top: 3rem;
    margin-bottom: 2rem;
}

.app-newsletter-form__form {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: flex-start;
    gap: 1rem;
    width: 100%;
    max-width: 30rem;
    position: relative;
    flex-wrap: wrap;

    button {
        /* Fully rounded pill. */
        border-radius: 999px;
        /* Same look as the buttons on hover: violet fill, white edges, with the
           soft white→violet gradient (= the inverted sticker blob, mirrored here
           on a rounded rectangle). White border + inset white glow. */
        background: var(--app-color-primary);
        border: 2px solid var(--app-color-light);
        box-shadow: inset 0 0 12px color-mix(in srgb, var(--app-color-light) 75%, transparent);
        color: var(--app-color-light);
        text-align: center;
        /* Match the email field's *visible* height: add the 2px top+bottom white
           border on top of the field's 2rem so the violet fill is exactly 2rem
           (the white border is invisible on the white background). */
        height: calc(2rem + 4px);
        box-sizing: border-box;
        padding: .25rem 1rem;
        line-height: 1rem;
        cursor: pointer;
        transition: opacity .2s ease;

        &:hover { opacity: .85; }
        &:disabled { opacity: .6; cursor: default; }
    }
}

.app-newsletter-form__form__label {
    width: 100%;
    max-width: 20rem;
    position: relative;
    padding-top: .75rem;

    input {
        border-radius: 1rem;
        height: 2rem;
        box-sizing: border-box;
        padding: .25rem 1rem;
        width: 100%;
        border: none;
        color: var(--app-color-primary);
        background: var(--app-color-light);
        /* "blob" inner glow — same primary purple as the sticker blobs. */
        box-shadow: inset 0 0 12px color-mix(in srgb, var(--app-color-primary) 65%, transparent);

        &::placeholder {
            /* "Your email address" — violet with opacity. */
            color: var(--app-color-primary);
            opacity: .5;
        }
    }
}

.app-newsletter-form__form__label__mail-info {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: .25rem;
    top: .5rem;
    left: 0;
    transform: translate(0, -100%);
}


.app-newsletter-form__title {
    margin: 0;
    /* Override the h3 user-agent bold so the blob text stays regular weight. */
    font-weight: normal;
}

.app-newsletter-form__btn {
    display: flex;
    justify-content: center;
    align-content: center;
}

.app-newsletter-form__msg {
    text-align: center;
}

.app-newsletter-transition-enter-active,
.app-newsletter-transition-leave-active {
    transition: opacity .25s cubic-bezier(0, .25, 0, 1),
                transform 1s cubic-bezier(0, .25, 0, 1);
}

.app-newsletter-transition-enter-from,
.app-newsletter-transition-leave-to {
    opacity: 0;
    transform: translate(0, -50%);
}

.app-newsletter-transition-enter-to,
.app-newsletter-transition-leave-from {
    opacity: 1;
    transform: translate(0, -100%);
}

</style>

<script setup lang="ts">
type SubscriptionStatus = 'ok' | 'error'

type NewsLetterValues =
    "Venu du site"

type SubscriberDataToSend = {
    email: string,
    groups: NewsLetterValues[],
}

type SubscriptionResponse = {
    error?: unknown
    message?: string
    status: SubscriptionStatus
}

type Props = {
    baseURL: string
    groups?: string[]  // groupe pour le tri dans la newsletter Infomaniak
    title?: string
    label?: string
    placeholder?: string
    submitLabel?: string
    submittingLabel?: string
    successMessage?: string
    errorMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
    groups: () => ['Venu du site'],
    title: 'Restez informé',
    label: 'Adresse email',
    placeholder: 'votre adresse mail',
    submitLabel: "S'inscrire",
    submittingLabel: 'Envoi...',
    successMessage: 'Merci pour votre inscription !',
    errorMessage: 'Une erreur est survenue. Veuillez réessayer.',
})

const emit = defineEmits<{
    success: []
    error: []
}>()

const email = ref('')
const isSubmitting = ref(false)
const message = ref('')
const isSuccess = ref(false)

const handleSubmit = async () => {
    isSubmitting.value = true
    message.value = ''

    if (!props.baseURL) {
        const errorMsg = 'Missing endpoint'
        message.value = `${props.errorMessage} (${errorMsg})`
        throw Error(errorMsg)
    }

    if (props.baseURL.endsWith('/')) {
        const errorMsg = 'baseURL should not end with a trailing slash'
        message.value = `${props.errorMessage} (${errorMsg})`
        throw Error(errorMsg)
    }

    try {
        const response = await fetch(props.baseURL + '/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email.value,
                groups: ["Venu du site"],
            } satisfies SubscriberDataToSend)
        })

        const responseData: SubscriptionResponse = await response.json()


        if (responseData.status === 'ok') {
            message.value = props.successMessage
            isSuccess.value = true
            email.value = ''
            emit("success")
            return
        }

        emit("error")

        message.value = `${props.errorMessage} (${responseData.message})`

        Error( responseData.message || props.errorMessage)
    } catch (error) {
        message.value = error instanceof Error ? error.message : props.errorMessage
        isSuccess.value = false
        emit('error')
    } finally {
        isSubmitting.value = false
    }
}
</script>
