import { mount } from 'svelte'
import ng from "../../../sdk/js/api-web"
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
