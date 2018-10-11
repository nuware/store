# Store


## Install

```bash
npm install @nuware/store --save
```

or

```html
<script defer src="https://unpkg.com/@nuware/store@latest/dist/store.umd.js"></script>
```

or

```html
<script defer src="https://unpkg.com/@nuware/store@latest/dist/store.min.js"></script>
```


## Usage

Browser

```javascript
const Store = window.nuware.Store
```

Node

```javascript
const Store = require('@nuware/store')
```

or

```javascript
import Store from '@nuware/store'
```

Initialize Store

```javascript
const store = Store({
  any: {
    initial: {
      state: true
    }
  }
})
```


## API

### Store

Factory function return the Store instance. You can pass the initial state of this Store.


### store

Store instance.

### store.ref()

### store.VALUE_EVENT

### store.CHILD_ADDED_EVENT

### store.CHILD_CHANGED_EVENT

### store.CHILD_REMOVED_EVENT


### ref

### ref.child()

### ref.parent()

### ref.get()

### ref.set()

### ref.remove()

### ref.on()

### ref.off()


## Authors

* Dmitry Dudin <dima@nuware.ru>


## License

* [MIT License](https://github.com/nuware/store/blob/master/LICENSE)
