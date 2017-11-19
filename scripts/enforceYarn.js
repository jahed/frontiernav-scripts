if (!/yarn/.test(process.env.npm_execpath)) {
    console.error('You must use Yarn to install dependencies.')
    process.exit(1)
}
