export class FormElement {

  /**
   * The parent.
   * 
   * Note: It is protected because we need to care about the parent/child relationships.
   */
  protected _parent: FormElement|null = null

  /**
   * The children.
   * 
   * Note: It is protected because we need to care about the parent/child relationships.
   */
  protected _children: FormElement[] = []

  name: string|undefined = undefined
  prototype: FormElement|null = null
  widget: Widget|null = null

  /**
   * @param name The name (optional)
   */
  constructor(name?: string) {
    if (name) {
      this.name = name
    }
  }

  /**
   * Get the parent.
   */
  get parent(): FormElement|null {
    return this._parent
  }

  /**
   * Set the parent. You do not need to set this by yourself. If you set it
   * the parents childrens are updated accordingly.
   */
  set parent(parent: FormElement|null) {
    if (this._parent !== null) {
      this._parent.remove(this)
    }

    if (parent === null) {
      this._parent = null
    }
    else {
      parent.add(this)
    }
  }

  /**
   * Get the root. If called from the root it return the root.
   */
  get root(): FormElement|null {
    if (this.parent !== null) {
      return this.parent.root
    }

    return this
  }

  /**
   * Get all children.
   */
  get children(): FormElement[] {
    return this._children
  }

  /**
   * Set all children. It will also adjust the parents of the children.
   */
  set children(elements: FormElement[]) {
    this.children.forEach(e => e._parent = null)
    this._children = elements
    this.children.forEach(e => e._parent = this)
  }

  /**
   * Add a child element. The added element will get its parent set.
   * 
   * @param element The element to be added.
   */
  add(...elements: FormElement[]): this {
    for (let element of elements) {
      this._children.push(element)
      element._parent = this
    }

    return this
  }

  /**
   * Remove a child wether by reference or by name
   * 
   * @param element May be a FormElement object or a name
   */
  remove(element: FormElement|string): FormElement|null {
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i]

      if (typeof element === 'string') {
        if (child.name === element) {
          this.children.splice(i)
          return child
        }
      }
      else {
        if (child === element) {
          this.children.splice(i)
          return child
        }
      }
    }

    return null
  }

  get path(): string {
    if (! this.name) {
      return ''
    }

    let path = ''
    let element: FormElement|null = this
    
    while (element !== null) {
      if (element.name) {
        path = element.name + (path ? '.' + path : '')
      }

      element = element.parent
    }

    return path
  }

  /**
   * Find an element down the tree with a path. The path can be given in dot notation
   * or as an array consisting of strings.
   * 
   * @param path The path as string or as array of strings
   */
  find(path: string|string[]): FormElement|null {
    let pathArray: string[] = []

    // determine if the path was given as string or array
    if (typeof path === 'string') {
      pathArray = splitPath(path)
    }
    else if (path instanceof Array) {
      pathArray = <string[]> path
    }

    // if there is nothing in the path then there is no element to find
    if (pathArray.length == 0) {
      return null
    }

    // get the first part of the path and look for an element with that name
    const first = pathArray[0]

    let element = null
    for (let child of this.children) {
      if (child.name === first) {
        element = child
      }
    }

    // if there are not any more parts in the path we are done
    if (pathArray.length == 0) {
      return element
    }

    // if an element was found
    if (element !== null) {

      // if the path still has parts left
      if (pathArray.length > 1) {

        // clone the path array
        const clonedPathArray = pathArray.slice()

        // remove first part of the path
        clonedPathArray.shift()

        // go on an look further
        element = element.find(clonedPathArray)
      }
    }
    // if there was no element found
    else {

      // iterator through all children not considering their name
      for (let child of this.children) {
        
        // if the child does not have a name and it has children ask it to find the element
        if (!child.name && child.children && child.children.length) {
          element = child.find(pathArray)
          
          if (element) {
            break
          }
        }
      }
    }

    return element
  }

  findField(path: string|string[]): Field|null {
    let pathArray: string[] = []

    // determine if the path was given as string or array
    if (typeof path === 'string') {
      pathArray = splitPath(path)
    }
    else if (path instanceof Array) {
      pathArray = <string[]> path
    }

    // if there is nothing in the path then there is no element to find
    if (pathArray.length == 0) {
      return null
    }

    // get the first part of the path and look for an element with that name
    const first = pathArray[0]

    let field: Field|null = null
    for (let child of this.children) {
      if (child instanceof Field && child.name === first) {
        field = child
      }
    }

    // if there are not any more parts in the path we are done
    if (pathArray.length == 0) {
      return field
    }

    // if an element was found
    if (field !== null) {

      // if the path still has parts left
      if (pathArray.length > 1) {

        // clone the path array
        const clonedPathArray = pathArray.slice()

        // remove first part of the path
        clonedPathArray.shift()

        // go on an look further
        field = field.findField(clonedPathArray)
      }
    }
    // if there was no element found
    else {

      // iterator through all children not considering their name
      for (let child of this.children) {

        // if the child has children ask it to find the element
        if (!child.name && child.children && child.children.length) {
          field = child.findField(pathArray)

          if (field) {
            break
          }
        }
      }
    }

    return field
  }

  protected findDirectSubFields(): Field[] {
    let fields: Field[] = []

    for (let child of this.children) {
      if (child instanceof Field) {
        fields.push(child)
      }
      else {
        const subFields = child.findDirectSubFields()
        fields = fields.concat(subFields)
      }
    }
    
    return fields
  }

  clone(): this {
    const clone = Object.create(this)
    
    clone.parent = this.parent
    clone.name = this.name
    clone.prototype = this.prototype ? this.prototype.clone() : null
    clone.widget = this.widget ? this.widget.clone() : null

    for (let child of this.children) {
      if (child) {
        const childClone = child.clone()
        childClone.parent = clone // will add the clone automatically to its parent
      }
    }

    return clone
  }
}

export enum FieldType {
  array = 'array',
  boolean = 'boolean',
  date = 'date',
  number = 'number',
  object = 'object',
  string = 'string'
}

export class Field extends FormElement {

  type: string|undefined = undefined
  protected _value: any = undefined

  /**
   * Attach options to your field. The standard renderers use this property when dealing with
   * fields of type array. When using the standard renderer you can use class Option. Of course
   * you can adjust the standard renderer to use a sub class of Option or even a completely
   * different class.
   */
  options: any[] = []

  constructor(type?: string, nameOrOptionsOrPrototype?: string|any[]|FormElement, optionsOrPrototype?: any[]|FormElement) {
    super()

    if (type) {
      this.type = type
    }

    if (nameOrOptionsOrPrototype) {
      if (typeof nameOrOptionsOrPrototype === 'string') {
        this.name = nameOrOptionsOrPrototype
      }

      if (Array.isArray(nameOrOptionsOrPrototype)) {
        this.options = nameOrOptionsOrPrototype
      }

      if (nameOrOptionsOrPrototype instanceof FormElement) {
        this.prototype = nameOrOptionsOrPrototype
      }
    }

    if (optionsOrPrototype) {
      if (Array.isArray(optionsOrPrototype)) {
        this.options = optionsOrPrototype
      }

      if (optionsOrPrototype instanceof FormElement) {
        this.prototype = optionsOrPrototype
      }
    }
  }

  get value(): any {
    return this._value
  }

  set value(value: any) {
    this._value = value

    if (this.type === FieldType.object && typeof value === 'object') {
      const subFields = this.findDirectSubFields()

      for (let field of subFields) {
        if (field.name && field.name in value) {
          field.value = value[field.name]
        }
      }
    }

    if (this.type === FieldType.array && Array.isArray(value)) {
      // clear all children in any way
      this.children = []

      // if there is a prototype set we can create new children. if not there are simply no children.
      // also the prototype needs to be an instance of Field. Otherwise we cannot set a value.
      if (this.prototype instanceof Field) {
        for (let arrayElement of value) {
          const clone = this.prototype.clone()
          clone.value = arrayElement
          this.add(clone)
        }
      }
    }
  }

  /**
   * Get the field path. It only considers fields and sub classes but not other form elements.
   */
  get fieldPath(): string {
    if (! this.name) {
      return ''
    }

    let fieldPath = ''
    let element: FormElement|null = this
    
    while (element !== null) {
      if (element instanceof Field && element.name) {
        fieldPath = element.name + (fieldPath ? '.' + fieldPath : '')
      }

      element = element.parent
    }

    return fieldPath
  }

  clone(): this {
    const clone = super.clone()

    clone.type = this.type
    clone.value = this.value

    for (let option of this.options) {
      if (option) {
        const optionClone = option.clone()
        clone.options.push(optionClone)
      }      
    }

    return clone
  }
}

export class Option {

  value: any = undefined
  label: string|undefined = undefined
  disabled: boolean = false

  clone(): this {
    const clone = Object.create(this)

    clone.value = this.value
    clone.label = this.label
    clone.disabled = this.disabled

    return clone
  }

}

export class Form extends Field {

  frame: FormFrame = new FormFrame

  constructor(type: string = FieldType.object) {
    super(type)
  }

  protected initFrame() {
    if (!this.frame) {
      this.frame = new FormFrame
    }
  }

  get title(): string|undefined {
    this.initFrame()
    return this.frame.title
  }

  set title(title: string|undefined) {
    this.initFrame()
    this.frame.title = title
  }

  get buttons(): Button[] {
    this.initFrame()
    return this.frame.buttons
  }

  set buttons(buttons: Button[]) {
    this.initFrame()
    this.frame.buttons = buttons
  }

  addButtons(buttons: any[]) {
    this.initFrame()
    this.frame.addButtons(buttons)
  }
}

export class FormFrame {

  title: string|undefined = undefined
  buttons: Button[] = []

  constructor(title?: string) {
    if (title) {
      this.title = title
    }
  }

  addButtons(buttons: Button[]) {
    for (let button of buttons) {
      this.buttons.push(button)
    }
  }
}

export class Button extends FormElement {

  label: string|undefined

}

export class Widget {
  clone(): this {
    const clone = Object.create(this)
    return clone
  }
}

function splitPath(path: String) {
  return path.split(".")
}

function joinPath(path: Array<String>) {
  return path.join(".")
}