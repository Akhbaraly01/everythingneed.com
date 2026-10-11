<?php

namespace Core\Services;

/**
 * Spec 44: unsafe-SVG protection for the media pipeline.
 *
 * SVG is XML that can carry script, event handlers, external references and
 * entity-expansion bombs. The sanitizer keeps a conservative working subset:
 *
 *  - rejects outright: DOCTYPE/ENTITY payloads (XXE + billion laughs),
 *    non-<svg> roots, unparseable XML;
 *  - removes: script/embedding elements, SMIL animation elements (they can
 *    retarget attributes), event-handler (on*) attributes, dangerous href
 *    schemes (javascript:/vbscript:/data:text) and CSS vectors
 *    (expression/javascript/@import);
 *  - keeps: drawing primitives, gradients/clip/mask/pattern, text, styles
 *    (clean), local (#...) references and http(s)/data:image links.
 */
final class SvgSanitizer
{
    private const BANNED_ELEMENTS = [
        'script', 'foreignobject', 'iframe', 'frame', 'frameset', 'object',
        'embed', 'audio', 'video', 'handler', 'listener',
        'animate', 'animatetransform', 'animatemotion', 'set', 'discard',
    ];

    public function sanitize(string $xml): ?string
    {
        $trimmed = trim($xml);
        if ($trimmed === '') {
            return null;
        }

        // Entity attacks and embedded PHP: legitimate SVGs never need these.
        if (preg_match('/<!DOCTYPE|<!ENTITY|<\?php/i', $trimmed)) {
            return null;
        }

        $previous = libxml_use_internal_errors(true);
        $dom = new \DOMDocument();
        $loaded = $dom->loadXML($trimmed, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_PARSEHUGE);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        if (! $loaded || $dom->documentElement === null) {
            return null;
        }

        if (strtolower((string) $dom->documentElement->localName) !== 'svg') {
            return null;
        }

        $this->removeProcessingInstructions($dom);
        $this->removeBannedElements($dom);
        $this->cleanAttributes($dom);
        $this->cleanStyleElements($dom);

        $out = $dom->saveXML();

        return ($out === false || trim($out) === '') ? null : $out;
    }

    private function removeProcessingInstructions(\DOMDocument $dom): void
    {
        $targets = [];
        foreach ($dom->childNodes as $child) {
            if ($child->nodeType === XML_PI_NODE || $child->nodeType === XML_DOCUMENT_TYPE_NODE) {
                $targets[] = $child;
            }
        }
        foreach ($targets as $node) {
            $dom->removeChild($node);
        }
    }

    private function removeBannedElements(\DOMDocument $dom): void
    {
        $xpath = new \DOMXPath($dom);
        $nodes = [];
        foreach (self::BANNED_ELEMENTS as $tag) {
            foreach ($xpath->query('//*[local-name()="'.$tag.'"]') ?: [] as $node) {
                $nodes[] = $node;
            }
        }
        foreach ($nodes as $node) {
            if ($node->parentNode !== null) {
                $node->parentNode->removeChild($node);
            }
        }
    }

    private function cleanAttributes(\DOMDocument $dom): void
    {
        $xpath = new \DOMXPath($dom);
        foreach ($xpath->query('//*') ?: [] as $element) {
            if (! $element instanceof \DOMElement) {
                continue;
            }

            foreach (iterator_to_array($element->attributes) as $attribute) {
                $local = strtolower((string) $attribute->localName);
                $value = trim($attribute->value);

                $drop = str_starts_with($local, 'on')
                    || ($local === 'href' && ! $this->safeHref($value))
                    || ($local === 'style' && preg_match('/expression\s*\(|javascript\s*:|vbscript\s*:|@import/i', $value) === 1);

                if ($drop) {
                    if ($attribute->namespaceURI !== null) {
                        $element->removeAttributeNS($attribute->namespaceURI, $attribute->localName);
                    } else {
                        $element->removeAttribute($attribute->name);
                    }
                }
            }
        }
    }

    private function cleanStyleElements(\DOMDocument $dom): void
    {
        $xpath = new \DOMXPath($dom);
        $remove = [];
        foreach ($xpath->query('//*[local-name()="style"]') ?: [] as $element) {
            if (preg_match('/expression\s*\(|javascript\s*:|vbscript\s*:|@import/i', $element->textContent) === 1) {
                $remove[] = $element;
            }
        }
        foreach ($remove as $node) {
            if ($node->parentNode !== null) {
                $node->parentNode->removeChild($node);
            }
        }
    }

    private function safeHref(string $value): bool
    {
        if ($value === '') {
            return false;
        }

        // Local fragment references (<use href="#icon">) are always fine.
        if ($value[0] === '#') {
            return true;
        }

        // data: is limited to raster images - never svg+xml (scriptable) or text.
        if (preg_match('#^data:image/(png|jpe?g|gif|webp|bmp)#i', $value) === 1) {
            return true;
        }

        if (preg_match('#^https?://#i', $value) === 1) {
            return true;
        }

        // Any other explicit scheme (javascript:, vbscript:, data:text, ftp:...) is out.
        if (preg_match('#^[a-z][a-z0-9+.\-]*:#i', $value) === 1) {
            return false;
        }

        // Relative path without traversal.
        return strpos($value, '..') === false;
    }
}
