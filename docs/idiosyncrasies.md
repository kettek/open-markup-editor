# Idiosyncrasies
This document describes specific idiosyncrasies of OME.

## Data Paths
When files are requested, OME iterates through the below paths and returns the first successful match.

### OME Root
The OME root location is a *read only* location used to read data.

The location is generated from `path.join(__dirname, '..')` which resolves to the root directory of the asar package or the project directory if running from source.

### OME Data
The OME data location is a *read only* location used to read data.

The location is generated from `path.join(path.dirname(argv[0]), process.platform == 'darwin' ? '..' : '')`. This resolves to the same location as OME root unless on Mac OS, in which case it resolves to `Open Markup Editor.app/Contents/`.

### User Data
The User data location is a *read-write* location used for storing user data, whether packs or the settings.

The locations differ by OS:

  * **Linux**: `$XDG_CONFIG_HOME/Open Markup Editor` or `~/config/Open Markup Editor`
  * **Mac OS**: `~/Library/Application Support/Open Markup Editor/`
  * **Windows**: `%APPDATA\Open Markup Editor\`

## Settings File
OME uses [electron-app-settings](https://github.com/kettek/electron-app-settings) for saving and loading settings. As such, it is located in the same location as [User Data](#user-data).

## Pack Locations
Packs are read from a directory named `packs` in any of the [Data Paths](#data-paths).

## Configuration System
Configuration within OME is done via a two-part configuration system.

The first part is that of declaration, where a particular key is defined with default values. For [packs](packs) this is the first parameter of the `conf(...)` method.

The second part is that of the UI, where a special array tree is used to define the UI and handle user interactions. This is the second paramter of the `pack.conf(...)` method.

### Declaration
The declaration is a simple object of key=>value pairs representing the configuration key and the value stored. Values may be tree structures.

### UI
The UI is a deep array structure that defines the UI and handles user interactions.

A brief example, showing a titled section and a labeled checkbox, would be:

```
  ['section', [
    ['h2', 'A Section'],
    ['checkbox', '', 'config_key'],
    ['label', 'A Checkbox', 'config_key']
  ]]
```

The basic format for declaring any element is `[<Tag Name>, <Text Content>, <Configuration Key>, {<Options,Handlers>}, [<Children>]]`. The most important rule to follow with this is that `String` type elements must be in the order of:

  * 1. Tag Name
  * 2. Text Content
  * 3. Configuration Key

These properties are optional, but if Text Content of Configuration Key are to be used, their precursors must also be defined as empty values.

If a configuration key is provided, it will be used for the `name` attribute in the case of `labels`. For any input-type elements, it will automatically be applied as the `value` and will automatically update the main configuration file if it is changed.

It is important to note that pack configurations will automatically use a long-form key such as `my-module.config_key`. Due to this, if custom event handlers are used on an object, global configuration calls can be set via the `settings.set(key, value)` on any module or global configuration.


