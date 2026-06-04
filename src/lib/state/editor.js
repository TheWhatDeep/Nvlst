/* Live editor stats — runtime only, not persisted.
   Updated by ProseEditor on each transaction; read by the editor meta. */
import { writable } from 'svelte/store'

export const liveWords = writable(0)
