import { createElement as e, Fragment } from '../lib/react.ts'
import { link, label, blockLabel } from '../utils.ts'
import { Checkbox } from './Checkbox.ts'
import { NumberField, TextField } from './Field.ts'
import { Fieldset } from './Fieldset.ts'
import { RadioGroups } from './RadioGroup.ts'

export const Options = () => {
  return e(
    Fragment,
    null,
    e(RadioGroups['upload-mode'], {
      title: 'Select a project by',
      labels: {
        id: [
          [
            'the ID of a project on the ',
            link('https://scratch.mit.edu/', 'Scratch website')
          ],
          label(
            'Project ID: ',
            e(NumberField, { name: 'id', placeholder: '104' })
          )
        ],
        file: ['selecting a file', ['file input here']],
        url: [
          'a project file hosted online',
          label(
            'URL: ',
            e(TextField, {
              name: 'project-url',
              placeholder: 'https://example.com/project.sb3'
            })
          )
        ]
      }
    }),
    e(
      Fieldset,
      { title: 'Options' },
      blockLabel(
        'Project name: ',
        e(TextField, { name: 'title' }),
        ' (the text displayed in the browser tab)'
      ),
      blockLabel(
        'Username value: ',
        e(TextField, { name: 'username' }),
        ' (the value that the username block reports)'
      ),
      blockLabel(
        e(Checkbox, { name: 'compatibility' }),
        ' Enable compatibility mode?'
      ),
      e(Fieldset, { title: 'Mouse pointers' }),
      e(Fieldset, { title: 'Monitor style' }),
      e(Fieldset, { title: 'Cloud variable source' }),
      e(Fieldset, {
        title: [
          link('https://sheeptester.github.io/scratch-gui/', 'E羊icques'),
          ' (modded) options'
        ]
      })
    )
  )
}
