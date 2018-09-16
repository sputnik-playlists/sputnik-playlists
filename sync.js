const fs = require("fs")
const Spotify = require("spotify-web-api-node")

/**
 * Create Spotify API object.
 */
function createSpotify () {
  // Load token.
  // Token is relative from root directory, as bot is designed to run from root.
  const token = fs.readFileSync(".access.token", "utf8").trim()
  // Create Spotify API object.
  const spotify = new Spotify()
  spotify.setAccessToken(token)
  return spotify
}

/**
 * Get all user playlists.
 *
 * Operation is batched to adhere to rate limits.
 *
 * @param uid Integer - User ID.
 */
async function getAllUserPlaylists (uid) {
  try {
    const spotify = createSpotify()
    let playlists = []
    const limit = 50
    // Playlist index.
    let offset = 0
    // Empty playlist guard variable.
    let empty = false
    while (!empty) {
      let options = { limit, offset }
      // Get user playlists.
      const results = await spotify.getUserPlaylists(uid, options)
        .then(response => response.body.items )
      // Add playlists to results.
      if (results && results.length) {
        playlists = playlists.concat(results)
        // Offset playlist index for next batch.
        offset += 50
      } else {
        empty = true
      }
    }
    return playlists
  } catch (e) {
    throw e
  }
}

const writePlaylistFile = (playlist) => {
  const { href, id, name  } = playlist

  const buildContents = (id, name) => {
    let contents = ""
    const seperator = "---\n"
    contents += seperator
    contents += "layout: default\n"
    contents += `title: "${name}"\n`
    contents += `uri: "${id}"\n`
    contents += seperator
    return contents
  }

  const buildSlug = (name) => {
    return name
      // Replace special characters with white space.
      .replace(/([^A-Z|a-z])/g, " ")
      // Replace white space with dash/
      .replace(/\s+/g, "-")
      .toLowerCase()
  }

  const slug = buildSlug(name)
  const contents = buildContents(id, name)
  fs.writeFileSync(`_playlists/${slug}.md`, contents)
}

/**
 * Entry function.
 */
async function main () {
  const uid = process.env.CLIENT_USER
  const playlists = await getAllUserPlaylists(uid)
  playlists.forEach(playlist => {
    writePlaylistFile(playlist)
  })
}

main()
