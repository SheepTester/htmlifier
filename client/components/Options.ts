import { createElement as e, FormEvent } from '../lib/react.ts'
import { link, label, blockLabel } from '../utils.ts'
import { Checkbox } from './Checkbox.ts'
import { NumberField, TextField } from './Field.ts'
import { Fieldset } from './Fieldset.ts'
import { File } from './File.ts'
import { HtmlifyBtn } from './HtmlifyBtn.ts'
import { RadioGroups } from './RadioGroup.ts'

type Props = {
  onHtmlify: () => void
  loading: boolean
}

export const Options = ({ onHtmlify, loading }: Props) => {
  return e(
    'form',
    {
      onSubmit: (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        onHtmlify()
      }
    },
    e(RadioGroups['upload-mode'], {
      title: 'Select a project by',
      labels: {
        id: [
          [
            'the ID of a project on the ',
            link('https://scratch.mit.edu/', 'Scratch website'),
            '.'
          ],
          label(
            'Project ID: https://scratch.mit.edu/projects/',
            e(NumberField, { name: 'id', placeholder: 104 }),
            '/'
          )
        ],
        file: [
          'selecting a file.',
          [e(File, { name: 'file', accept: '.sb,.sb2,.sb3' })]
        ],
        url: [
          'a project file hosted online.',
          label(
            'URL to the file: ',
            e(TextField, {
              name: 'project-url',
              placeholder: 'https://example.com/project.sb3',
              type: 'url'
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
        // TODO: Set title when selecting a file if the title was unchanged
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
      blockLabel(
        e(Checkbox, { name: 'turbo' }),
        ' Enable ',
        link('https://en.scratch-wiki.info/wiki/Turbo_Mode', 'turbo mode'),
        '?'
      ),
      blockLabel(
        'Favicon (the tab icon): ',
        e(File, { name: 'favicon-file', accept: 'image/*' })
      ),
      blockLabel(
        'Background image (shows black bars by default): ',
        e(File, { name: 'background-file', accept: 'image/*' })
      ),
      e(
        'p',
        null,
        label(e(Checkbox, { name: 'progress' }), ' Show loading progress bar?'),
        ' ',
        label(
          'Colour: ',
          e(TextField, { name: 'progress-colour', type: 'color' })
        )
      ),
      e(RadioGroups['loading-image'], {
        title: 'Use loading image from',
        labels: {
          file: [
            'a selected file.',
            e(File, { name: 'loading-image-file', accept: 'image/*' })
          ],
          url: [
            'an image URL.',
            label(
              'URL of the image: ',
              e(TextField, {
                name: 'loading-image-url',
                placeholder: 'https://example.com/image.png',
                type: 'url'
              })
            )
          ]
        }
      }),
      blockLabel(
        e(Checkbox, { name: 'autostart' }),
        ' Start project immediately on load?'
      ),
      blockLabel(
        e(Checkbox, { name: 'fullscreen' }),
        ' Show fullscreen button?'
      ),
      blockLabel(
        e(Checkbox, { name: 'start-stop-controls' }),
        ' Show start/stop buttons?'
      ),
      e(RadioGroups['stretch'], {
        title: 'What should be stretched?',
        labels: {
          stage: 'The stage and loading image.',
          'loading-image': 'Only the loading image.',
          none: "Don't stretch anything; maintain the project's aspect ratio."
        }
      }),
      blockLabel(
        e(Checkbox, { name: 'zip' }),
        " Output a .zip file? The .zip file will contain an index.html file and separate files for the project's assets, but this means opening the HTML file directly in the browser won't work. ",
        link(
          'https://github.com/SheepTester/htmlifier/wiki/Downloading-as-a-.zip',
          'Learn more about the .zip file.'
        )
      ),
      e(
        Fieldset,
        { title: 'Mouse pointers' },
        e(RadioGroups['cursor'], {
          title: 'Cursor style',
          labels: {
            default: 'Use the default cursor.',
            none: 'Hide the cursor.',
            file: [
              'Use a custom cursor.',
              label(
                'For best results, select a PNG that is up to 32 by 32 pixels: ',
                e(File, { name: 'cursor-file', accept: 'image/*' })
              )
            ]
          }
        })
      ),
      blockLabel(
        e(Checkbox, { name: 'zip' }),
        ' Lock the pointer on click? The mouse x/y blocks will report the ',
        e('em', null, 'accumulative'),
        ' mouse position, which you can use to determine the change in position between frames.'
      ),
      e(
        Fieldset,
        { title: 'Monitor style' },
        e(
          'p',
          null,
          label(
            e(Checkbox, { name: 'use-colour' }),
            ' Use opaque variable/list monitors? (If unchecked, a translucent black will be used.)'
          ),
          ' ',
          label(
            'Colour: ',
            e(TextField, { name: 'monitor-colour', type: 'color' })
          )
        ),
        blockLabel(
          'Monitor text colour: ',
          e(TextField, { name: 'monitor-text', type: 'color' })
        ),
        blockLabel(
          e(Checkbox, { name: 'transparent-monitor' }),
          ' Hide the monitor background boxes?'
        )
      ),
      e(
        Fieldset,
        { title: 'Cloud variable source' },
        e(RadioGroups['cloud-provider'], {
          title: 'Cursor style',
          labels: {
            localstorage: 'Save cloud variables locally using localStorage.',
            ws: [
              'Use a cloud variable server.',
              label(
                'Server URL: ',
                e(TextField, {
                  name: 'cloud-ws',
                  placeholder: 'ws://localhost:3000/',
                  type: 'url'
                }),
                " Scratch doesn't let other websites use its cloud server, but you can host your own using programs like ",
                link(
                  'https://github.com/SheepTester/primitive-cloud-server',
                  'primitive-cloud-server'
                ),
                '.'
              )
            ]
          }
        }),
        blockLabel(
          e(Checkbox, { name: 'special-cloud' }),
          ' Give certain cloud variables special behaviours depending on the name?'
        )
      ),
      e(
        Fieldset,
        {
          title: [
            link('https://sheeptester.github.io/scratch-gui/', 'E羊icques'),
            ' (modded) options'
          ]
        },
        e(
          'p',
          null,
          label(e(Checkbox, { name: 'wider' }), ' Use a custom stage size?'),
          ' ',
          label('Width: ', e(NumberField, { name: 'width', placeholder: 480 })),
          label(
            'Height: ',
            e(NumberField, { name: 'height', placeholder: 360 })
          )
        ),
        blockLabel(
          'Load ',
          link(
            'https://github.com/LLK/scratch-vm/blob/develop/docs/extensions.md#types-of-extensions',
            'unofficial extension'
          ),
          ' from URL: ',
          e(TextField, { name: 'extension-url' }),
          blockLabel(
            e(Checkbox, { name: 'no-limits' }),
            ' Remove limits such as clone and list length limits?'
          )
        )
      )
    ),
    blockLabel(
      e(Checkbox, { name: 'autodownload' }),
      ' Download automatically?'
    ),
    e(HtmlifyBtn, {
      disabled: loading,
      onClick: onHtmlify
    })
  )
}
