# In Silico Vita

Клеточная эволюционная симуляция.

[▶ Демо](https://vlarodio.github.io/in-silico-vita/)

## Установка

```bash
npm install in-silico-vita
```

## Использование

```html
<div id="app"></div>
<script type="module">
  import { createSimulation } from "in-silico-vita";
  createSimulation(document.getElementById("app"));
</script>
```

## API

```ts
createSimulation(container: HTMLElement, options?: Partial<SimParams>): SimState
```
