/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const prettierConfig = {
    arrowParens: 'avoid',
    bracketSameLine: true,
    bracketSpacing: true,
    endOfLine: 'lf',
    jsxSingleQuote: true,
    printWidth: 120,
    proseWrap: 'preserve',
    quoteProps: 'consistent',
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
    useTabs: false,
    tabWidth: 4,
    plugins: ['prettier-plugin-tailwindcss'],
    tailwindConfig: './tailwind.config.ts',
    tailwindFunctions: ['clsx', 'classnames', 'cn', 'cva', 'tw', 'twMerge'],
}

export default prettierConfig
