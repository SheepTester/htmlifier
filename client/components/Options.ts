import { createElement as e, FormEvent, Fragment } from '../lib/react.ts'
import { link, label, blockLabel } from '../utils.ts'
import { Checkbox } from './Checkbox.ts'
import { NumberField, TextField } from './Field.ts'
import { Fieldset } from './Fieldset.ts'
import { File } from './File.ts'
import { Footnote } from './Footnote.ts'
import { HtmlifyBtn } from './HtmlifyBtn.ts'
import { RadioGroups } from './RadioGroup.ts'
import { UrlOrFileList } from './UrlOrFileList.ts'

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
      title: 'Select a project by...',
      labels: {
        id: [
          e(
            Fragment,
            null,
            'a project ID on ',
            link('https://scratch.mit.edu/', 'Scratch'),
            '.'
          ),
          label(
            'Project ID: ',
            e(NumberField, { name: 'id', placeholder: 104 })
          )
        ],
        file: [
          'selecting a file on your computer:',
          e(File, { name: 'file', accept: '.sb,.sb2,.sb3' })
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
        'Text to show in the browser tab: ',
        // TODO: Set title when selecting a file if the title was unchanged
        e(TextField, { name: 'title' })
      ),
      blockLabel(
        'Value of the ',
        e('code', null, 'username'),
        ' block: ',
        e(TextField, { name: 'username' })
      ),
      blockLabel(
        'Frames per second: ',
        e(NumberField, { name: 'fps', placeholder: 30 })
      ),
      blockLabel(
        e(Checkbox, { name: 'turbo' }),
        ' Enable ',
        link('https://en.scratch-wiki.info/wiki/Turbo_Mode', 'turbo mode'),
        '.'
      ),
      blockLabel(
        'Tab icon (favicon): ',
        e(File, { name: 'favicon-file', accept: 'image/*' })
      ),
      blockLabel(
        'Background image: ',
        e(File, { name: 'background-file', accept: 'image/*' }),
        ' Default: a black background.'
      ),
      e(
        'p',
        null,
        label(
          e(Checkbox, { name: 'progress' }),
          ' Show a progress bar while loading.'
        ),
        ' ',
        label(
          'Colour of the progress bar: ',
          e(TextField, { name: 'progress-colour', type: 'color' })
        )
      ),
      blockLabel(
        e(Checkbox, { name: 'autostart' }),
        ' Press the green flag automatically.',
        e(
          Footnote,
          { id: '5' },
          'Browsers do not let websites automatically play audio until the user interacts with the website by clicking/tapping somewhere. If sound is important, then you should make the user click on the project before starting.'
        )
      ),
      blockLabel(
        e(Checkbox, { name: 'fullscreen' }),
        ' Show a fullscreen button.'
      ),
      blockLabel(
        e(Checkbox, { name: 'start-stop-controls' }),
        ' Show start/stop buttons, equivalent to the green flag/stop sign.'
      ),
      blockLabel(
        e(Checkbox, { name: 'download-btn' }),
        ' Show a button that downloads an .sb3 with the current state of the project.'
      ),
      blockLabel(
        e(Checkbox, { name: 'add-sprite-btn' }),
        ' Show a button that lets you select a sprite to add.'
      ),
      e(RadioGroups['loading-image'], {
        title: 'What image should show while the project loads?',
        labels: {
          file: [
            'A file on my computer.',
            e(
              Fragment,
              null,
              'Select a file: ',
              e(File, { name: 'loading-image-file', accept: 'image/*' })
            )
          ],
          url: [
            'An image online.',
            label(
              'URL to the image: ',
              e(TextField, {
                name: 'loading-image-url',
                placeholder: 'https://example.com/image.png',
                type: 'url'
              })
            )
          ]
        }
      }),
      e(RadioGroups['stretch'], {
        title: 'What should be stretched?',
        labels: {
          stage: 'The stage and loading image.',
          'loading-image': 'Only the loading image.',
          none: "Don't stretch anything; maintain the project's aspect ratio."
        }
      }),
      e(
        Fieldset,
        { title: 'Mouse pointer (cursor)' },
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
        }),
        blockLabel(
          e(Checkbox, { name: 'pointer-lock' }),
          ' Lock the pointer when the user clicks on the project.',
          e(
            Footnote,
            { id: '3' },
            'The mouse x/y blocks will report the ',
            e('em', null, 'accumulative'),
            ' mouse position, which you can use to determine the change in position between frames. If you enable this, you should also ',
            link('#no-limits', 'disable the maximum mouse x/y limit'),
            '.'
          )
        )
      ),
      e(
        Fieldset,
        { title: 'Variable/list monitor colour' },
        e(RadioGroups['monitor-value'], {
          title: 'Monitor value background colour',
          labels: {
            translucent: 'Translucent black.',
            colour: [
              'Opaque',
              label(
                'colour: ',
                e(TextField, { name: 'monitor-colour', type: 'color' })
              )
            ]
          }
        }),
        blockLabel(
          'Monitor text colour: ',
          e(TextField, { name: 'monitor-text', type: 'color' })
        ),
        blockLabel(
          e(Checkbox, { name: 'transparent-monitor' }),
          ' Hide the boxes surrounding the monitors.'
        )
      ),
      e(
        Fieldset,
        { title: 'Cloud variables' },
        e(RadioGroups['cloud-provider'], {
          title: 'Where should cloud variables be stored?',
          labels: {
            localstorage: [
              e(
                Fragment,
                null,
                'Save them in the browser. Good for saving game data.',
                e(
                  Footnote,
                  { id: '1' },
                  'Some jurisdictions have laws regarding the use of cookies, which you will have to deal if you share the converted project outside of Scratch.'
                )
              ),
              null
            ],
            ws: [
              'Use a cloud variable server. Required for multiplayer.',
              label(
                'Server URL: ',
                e(TextField, {
                  name: 'cloud-ws',
                  placeholder: 'ws://localhost:3000/',
                  type: 'url'
                }),
                e(
                  Footnote,
                  { id: 'cloud-server' },
                  " Scratch doesn't let other websites use its cloud server, but you can host your own using programs like ",
                  link(
                    'https://github.com/SheepTester/primitive-cloud-server',
                    'primitive-cloud-server'
                  ),
                  '.'
                )
              )
            ]
          }
        }),
        blockLabel(
          e(Checkbox, { name: 'special-cloud' }),
          ' Give cloud variables with certain names ',
          link(
            'https://github.com/SheepTester/htmlifier/wiki/Special-cloud-behaviours',
            'special behaviours'
          ),
          '.',
          e(
            Footnote,
            { id: '4' },
            "Special cloud variable behaviours are non-standard way for Scratch projects to do things that normally can't be done in Scratch. See a list of the special behaviours for different cloud variable names on the ",
            link(
              'https://github.com/SheepTester/htmlifier/wiki/Special-cloud-behaviours',
              'wiki'
            ),
            '. You can use ',
            link(
              'https://sheeptester.github.io/scratch-gui/?special_cloud=true',
              'E羊icques'
            ),
            ' to use the special behaviours in the editor.'
          )
        )
      ),
      e(
        'p',
        null,
        'Include custom JavaScript',
        e(
          Footnote,
          { id: 'plugins' },
          'The custom JavaScript will be included in the HTML file so that you can add custom functionality to the project. These are also compatible with ',
          link('https://sheeptester.github.io/scratch-gui/', 'E羊icques'),
          ' plugins.'
        ),
        ':'
      ),
      e(UrlOrFileList, {
        name: 'plugins',
        placeholder: 'https://example.com/script.js',
        accept: '.js'
      }),
      e(
        Fieldset,
        {
          title: e(
            Fragment,
            null,
            link('https://sheeptester.github.io/scratch-gui/', 'E羊icques'),
            ' (modded) options'
          )
        },
        e(
          'p',
          null,
          label(
            'Stage width: ',
            e(NumberField, { name: 'width', placeholder: 480 })
          ),
          label(
            'Height: ',
            e(NumberField, { name: 'height', placeholder: 360 })
          )
        ),
        e(
          'p',
          null,
          'Load ',
          link(
            'https://github.com/LLK/scratch-vm/blob/develop/docs/extensions.md#types-of-extensions',
            'unofficial extension'
          ),
          ' from URL:'
        ),
        e(UrlOrFileList, {
          name: 'extensions',
          placeholder: 'https://example.com/extension.js',
          accept: '.js'
        }),
        blockLabel(
          e(Checkbox, { name: 'limits' }),
          ' Enforce limits such as the clone and list length limits.'
        ),
        blockLabel(
          e(Checkbox, { name: 'fencing' }),
          ' Prevent sprites from moving off-screen (sprite fencing).'
        )
      )
    ),
    blockLabel(
      e(Checkbox, { name: 'zip' }),
      ' Create a .zip file.',
      e(
        Footnote,
        { id: 'zip' },
        "The .zip file will contain an index.html file and separate files for the project's assets, but this means opening the HTML file directly in the browser won't work. ",
        link(
          'https://github.com/SheepTester/htmlifier/wiki/Downloading-as-a-.zip',
          'Learn more about the .zip file.'
        )
      )
    ),
    blockLabel(
      e(Checkbox, { name: 'autodownload' }),
      ' Download automatically when the conversion finishes.'
    ),
    e(HtmlifyBtn, {
      disabled: loading,
      onClick: onHtmlify
    })
  )
}
