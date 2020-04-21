import React from "react"
import { useQuery, useMutation } from "urql"

const InstallInput = () => {
  const [value, setValue] = React.useState("")

  const [_, installGatbyPlugin] = useMutation(`
    mutation installGatsbyPlugin($name: String!) {
      createNpmPackage(npmPackage: {
        name: $name,
        dependencyType: "production"
      }) {
        id
        name
      }
      createGatsbyPlugin(gatsbyPlugin: {
        name: $name
      }) {
        id
        name
      }
    }
  `)

  return (
    <form
      onSubmit={evt => {
        evt.preventDefault()
        installGatbyPlugin({
          name: value,
        })
      }}
    >
      <label>
        Install:
        <input
          value={value}
          onChange={evt => setValue(evt.target.value)}
          type="text"
          placeholder="gatsby-plugin-cool"
        />
      </label>
    </form>
  )
}

const DestroyButton = ({ name }) => {
  const [_, deleteGatsbyPlugin] = useMutation(`
    mutation destroyGatsbyPlugin($name: String!) {
      destroyNpmPackage(npmPackage: {
        name: $name,
        id: $name,
        dependencyType: "production"
      }) {
        id
        name
      }
      destroyGatsbyPlugin(gatsbyPlugin: {
        name: $name,
        id: $name
      }) {
        id
        name
      }
    }
  `)

  return <button onClick={() => deleteGatsbyPlugin({ name })}>X</button>
}

export default (): React.ReactElement => {
  const [{ data, fetching, error }] = useQuery({
    query: `
      {
        allGatsbyPlugin {
          nodes {
            name
            id
            shadowedFiles
            shadowableFiles
          }
        }
        npmPackageJson(id: "name") {
          name
          value
        }
      }
    `,
  })

  if (fetching) return <p>Loading...</p>

  if (error) return <p>Oops something went wrong.</p>

  return (
    <>
      <h1>{data.npmPackageJson.value.replace(/^"|"$/g, ``)}</h1>
      <h2>Plugins</h2>
      <ul>
        {data.allGatsbyPlugin.nodes
          .filter(plugin => plugin.name.indexOf(`gatsby-plugin`) === 0)
          .map(plugin => (
            <li key={plugin.id}>
              {plugin.name} <DestroyButton name={plugin.name} />
            </li>
          ))}
      </ul>
      <InstallInput />
      <h2>Themes</h2>
      <ul>
        {data.allGatsbyPlugin.nodes
          .filter(plugin => plugin.name.indexOf(`gatsby-theme`) === 0)
          .map(plugin => (
            <li key={plugin.id}>
              <details>
                <summary>
                  {plugin.name} <DestroyButton name={plugin.name} />
                </summary>
                <ul>
                  {plugin.shadowedFiles.map(file => (
                    <li key={file} style={{ opacity: 0.6 }}>
                      {file} (shadowed)
                    </li>
                  ))}
                  {plugin.shadowableFiles.map(file => (
                    <li key={file}>{file}</li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
      </ul>

      <InstallInput />
    </>
  )
}
