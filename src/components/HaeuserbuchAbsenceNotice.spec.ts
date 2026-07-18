import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HaeuserbuchAbsenceNotice from './HaeuserbuchAbsenceNotice.vue'
import type { Gemeinde } from '@/stores/flurStore'

function gemeinde(name: string, haeuserbuch: boolean): Gemeinde {
    return { name, haeuserbuch } as Gemeinde
}

describe('HaeuserbuchAbsenceNotice', () => {
    it('renders nothing when the Gemeinde has a Häuserbuch', () => {
        const wrapper = mount(HaeuserbuchAbsenceNotice, {
            props: { gemeinde: gemeinde('Dortmund', true) },
        })

        expect(wrapper.find('.haeuserbuch-absence').exists()).toBe(false)
        expect(wrapper.text()).toBe('')
    })

    it('renders the collapsed headline when no Häuserbuch is on file', () => {
        const wrapper = mount(HaeuserbuchAbsenceNotice, {
            props: { gemeinde: gemeinde('Berghofen', false) },
        })

        expect(wrapper.find('.haeuserbuch-absence').exists()).toBe(true)
        expect(wrapper.text()).toContain('Kein Häuserbuch')
        expect(wrapper.find('p').exists()).toBe(false)
        expect(wrapper.text()).not.toContain('Berghofen')
    })

    it('reveals the explanation for the Gemeinde when the headline is expanded', async () => {
        const wrapper = mount(HaeuserbuchAbsenceNotice, {
            props: { gemeinde: gemeinde('Berghofen', false) },
        })

        await wrapper.find('h3').trigger('click')

        expect(wrapper.find('p').exists()).toBe(true)
        expect(wrapper.text()).toContain('Berghofen')
    })

    it('honours the expanded prop', () => {
        const wrapper = mount(HaeuserbuchAbsenceNotice, {
            props: { gemeinde: gemeinde('Berghofen', false), expanded: true },
        })

        expect(wrapper.find('p').exists()).toBe(true)
        expect(wrapper.text()).toContain('Berghofen')
    })
})
