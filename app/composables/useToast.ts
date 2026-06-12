export function useToast() {
    const visible = ref(false)
    const progress = ref(100)

    let timer: ReturnType<typeof setTimeout> | null = null
    let interval: ReturnType<typeof setInterval> | null = null

    function clear() {
        if (timer) clearTimeout(timer)
        if (interval) clearInterval(interval)
    }

    function show(duration = 3000) {
        clear()

        visible.value = true
        progress.value = 100

        const stepTime = 50
        const steps = duration / stepTime
        let step = 0

        interval = setInterval(() => {
            step++
            progress.value = 100 - (step / steps) * 100
            if (step >= steps) clear()
        }, stepTime)

        timer = setTimeout(() => hide(), duration)
    }

    function hide() {
        clear()
        visible.value = false
    }

    onUnmounted(clear)

    return {
        visible,
        progress,
        show,
        hide,
    }
}