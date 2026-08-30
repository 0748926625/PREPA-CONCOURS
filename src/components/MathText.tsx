import { Fragment, useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

/**
 * Affiche un texte pouvant contenir des formules LaTeX délimitées par `$...$` (utilisé par les
 * QCM de mathématiques). Le texte hors formule reste du texte brut ; chaque segment `$...$` est
 * rendu avec KaTeX. Un rendu impossible retombe silencieusement sur la formule brute plutôt que
 * de planter l'écran.
 */
export default function MathText({ text }: { text: string }) {
  const parts = useMemo(() => text.split(/(\$[^$]+\$)/g), [text])

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
          const formula = part.slice(1, -1)
          try {
            const html = katex.renderToString(formula, { throwOnError: false, output: 'html' })
            return <Fragment key={i}><span dangerouslySetInnerHTML={{ __html: html }} /></Fragment>
          } catch {
            return <Fragment key={i}>{part}</Fragment>
          }
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}
