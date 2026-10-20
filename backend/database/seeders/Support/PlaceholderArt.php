<?php

namespace Database\Seeders\Support;

/**
 * High-contrast GD placeholder artwork for seeded records (design v2).
 *
 * The v1 seed cards were a pale washed-out gradient with ~13px built-in-font
 * text — essentially invisible at card sizes. v2 renders an 800x800 square
 * (cards crop with object-cover, so square avoids letterboxing) with:
 *
 *  - a rich dark gradient derived from the record id (deterministic hue),
 *  - two soft decorative circles and a hairline frame,
 *  - a large subject glyph (package, bed, fork, book, house, pill, bag, star),
 *  - the record title in bold TTF at ~50px with a drop shadow,
 *  - an accent eyebrow label above the title.
 *
 * Everything is deterministic per seed string; no two adjacent records share
 * a palette. Returns null when GD is unavailable (callers fall back to
 * /placeholder.svg).
 *
 * Design v4 adds renderProduct(): an ecommerce-style studio shot — neutral
 * light backdrop with a soft spotlight, floor line and contact shadow, and
 * the type-aware glyph rendered as an opaque shaded object (base + highlight
 * + shadow facets) with no baked-in title text, since the card already shows
 * the name/category/price under the image. ProductImageSeeder prefers real
 * photos dropped into database/seeders/assets/products/ and only falls back
 * to renderProduct() when none is present.
 */
final class PlaceholderArt
{
    private const FONT_CANDIDATES = [
        'C:\\Windows\\Fonts\\arialbd.ttf',
        'C:\\Windows\\Fonts\\segoeuib.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
        '/Library/Fonts/Arial Bold.ttf',
    ];

    private const BUILTIN_FONT = 5;

    private static bool $fontResolved = false;

    private static ?string $font = null;

    /**
     * Render a titled card (products, hotels, courses, ...).
     *
     * @param  string  $seed    Deterministic palette source (usually the row id).
     * @param  string  $title   Big centered headline; empty renders no text.
     * @param  string  $eyebrow Small accent label above the title.
     * @param  string  $glyph   box, bed, food, book, house, pill, bag, star, shirt,
     *                          pants, dress, shoe, phone, laptop, headphones, watch,
     *                          tv, camera, sofa, pot, bottle, plant, ball, toy.
     */
    public static function render(
        string $seed,
        string $title = '',
        string $eyebrow = '',
        string $glyph = 'box',
        int $w = 800,
        int $h = 800,
    ): ?string {
        if (! extension_loaded('gd')) {
            return null;
        }

        $hue = hexdec(substr(md5($seed), 0, 2)) / 255;
        $img = self::paintBackground($hue, $w, $h);
        if ($img === null) {
            return null;
        }

        $title = trim($title);
        $hasText = $title !== '';
        // Text-free art (avatars) gets a larger glyph — nothing else to show.
        $glyphSize = (int) (min($w, $h) * ($hasText ? 0.30 : 0.44));
        $cx = (int) ($w / 2);
        $glyphCy = $hasText ? (int) ($h * 0.30) : (int) ($h / 2);
        self::drawGlyph($img, $glyph, $cx, $glyphCy, $glyphSize, 58);

        if ($hasText) {
            self::drawHeadline($img, $hue, $title, trim($eyebrow), $cx, $glyphCy + (int) ($glyphSize * 0.62), $w, $h);
        }

        return self::png($img);
    }

    /**
     * Text-free wide backdrop for banner slots (the component overlays its own
     * copy on top of the image, so artwork in the image would double up).
     *
     * @param  string  $glyph  Subject glyph for the right third.
     */
    public static function renderBackdrop(
        string $seed,
        string $glyph = 'star',
        int $w = 1200,
        int $h = 320,
    ): ?string {
        if (! extension_loaded('gd')) {
            return null;
        }

        $hue = hexdec(substr(md5($seed), 0, 2)) / 255;
        $img = self::paintBackground($hue, $w, $h);
        if ($img === null) {
            return null;
        }

        // Faint oversized glyph on the right; the slider copy sits left/center.
        self::drawGlyph($img, $glyph, (int) ($w * 0.86), (int) ($h / 2), (int) ($h * 0.78), 100);

        return self::png($img);
    }

    /**
     * Design v4: studio product shot for catalog cards (800x800 by default).
     *
     * Neutral light backdrop + spotlight glow + floor line + soft contact
     * shadow; the type-aware glyph (productGlyph) is drawn as an opaque
     * shaded object (base fill, highlight facets, shadow facets) with no
     * baked-in text. Deterministic per seed; used only when no real photo is
     * available for the product.
     */
    public static function renderProduct(
        string $seed,
        string $name,
        string $category = '',
        int $w = 800,
        int $h = 800,
    ): ?string {
        if (! extension_loaded('gd')) {
            return null;
        }

        $hue = hexdec(substr(md5($seed), 0, 2)) / 255;
        $img = self::paintStudio($hue, $w, $h);
        if ($img === null) {
            return null;
        }

        self::drawGlyph(
            $img,
            self::productGlyph($name, $category),
            (int) ($w / 2),
            (int) ($h * 0.43),
            (int) (min($w, $h) * 0.56),
            0,
            self::hslToRgb($hue, 0.55, 0.50),
            self::hslToRgb($hue, 0.62, 0.66),
            self::hslToRgb($hue, 0.60, 0.34),
        );

        return self::png($img);
    }

    /**
     * Design v3: pick the glyph that represents a product by keyword-matching
     * its name first ("Cotton T-Shirt" -> shirt, "Denim Jeans" -> pants) and
     * falling back to a per-category default. Deterministic and dependency-free.
     */
    public static function productGlyph(string $name, string $category = ''): string
    {
        $name = strtolower($name);
        $category = strtolower($category);

        $rules = [
            'pill' => ['medicine', 'syrup', 'capsule', 'vitamin', 'pharma', 'tablet'],
            'shoe' => ['shoe', 'sneaker', 'boot', 'sandal', 'slipper', 'loafer', 'heel'],
            'dress' => ['dress', 'gown', 'skirt'],
            'pants' => ['jeans', 'trouser', 'pant', 'short', 'legging', 'jogger', 'chino'],
            'shirt' => ['shirt', 'tee shirt', 't-shirt', 'tshirt', 'polo', 'blouse', 'hoodie', 'sweater', 'sweatshirt', 'jacket', 'coat', 'suit', 'cardigan', 'vest', 'uniform', 'sock', 'underwear', 'cap', 'hat'],
            'headphones' => ['headphone', 'earphone', 'earbud', 'airpod', 'headset', 'speaker'],
            'laptop' => ['laptop', 'macbook', 'notebook', 'ultrabook', 'desktop', 'computer'],
            'phone' => ['phone', 'smartphone', 'iphone', 'android', 'tablet', 'ipad', 'charger', 'power bank', 'powerbank', 'cable', 'keyboard', 'mouse', 'router'],
            'watch' => ['watch'],
            'camera' => ['camera', 'dslr', 'drone', 'gopro', 'webcam'],
            'tv' => ['tv', 'television', 'monitor', 'projector', 'screen', 'soundbar'],
            'sofa' => ['sofa', 'couch', 'chair', 'table', 'desk', 'shelf', 'cabinet', 'furniture', 'mattress', 'lamp'],
            'pot' => ['kitchen', 'kettle', 'pot', 'pan', 'blender', 'cooker', 'cookware', 'utensil', 'mug', 'cup', 'plate', 'toaster'],
            'bottle' => ['cream', 'lotion', 'perfume', 'shampoo', 'serum', 'soap', 'cosmetic', 'makeup', 'lipstick', 'sunscreen'],
            'ball' => ['ball', 'football', 'basketball', 'soccer', 'tennis', 'gym', 'fitness', 'yoga', 'dumbbell', 'cycle', 'bike'],
            'toy' => ['toy', 'doll', 'lego', 'puzzle', 'teddy'],
            'plant' => ['seed', 'seedling', 'fertilizer', 'fertiliser', 'compost', 'soil', 'plant', 'sprayer', 'irrigation', 'maize', 'crop', 'farm'],
            'food' => ['milk', 'rice', 'oil', 'flour', 'tea', 'coffee', 'snack', 'fruit', 'vegetable', 'juice', 'goat', 'sugar', 'spice'],
            'book' => ['book', 'novel', 'guide', 'textbook'],
        ];

        foreach ($rules as $glyph => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($name, $keyword)) {
                    return $glyph;
                }
            }
        }

        foreach (['clothing' => 'shirt', 'fashion' => 'shirt', 'apparel' => 'shirt',
            'electronics' => 'phone', 'tech' => 'phone', 'computers' => 'laptop',
            'agriculture' => 'plant', 'farm' => 'plant',
            'beauty' => 'bottle', 'health-beauty' => 'bottle', 'cosmetics' => 'bottle',
            'home' => 'sofa', 'home-garden' => 'sofa', 'furniture' => 'sofa',
            'sports' => 'ball', 'outdoors' => 'ball',
            'books' => 'book', 'food' => 'food', 'beverages' => 'food',
            'pharmacy' => 'pill', 'health' => 'pill'] as $needle => $glyph) {
            if (str_contains($category, $needle)) {
                return $glyph;
            }
        }

        return 'box';
    }

    /** @return \GdImage|null */
    private static function paintBackground(float $hue, int $w, int $h)
    {
        [$r, $g, $b] = self::hslToRgb($hue, 0.58, 0.24);

        $img = imagecreatetruecolor($w, $h);
        if ($img === false) {
            return null;
        }

        // Vertical gradient: dark at the top, slightly lifted at the bottom.
        for ($y = 0; $y < $h; $y++) {
            $t = $y / $h;
            $row = imagecolorallocate(
                $img,
                min(255, (int) ($r + 60 * $t)),
                min(255, (int) ($g + 60 * $t)),
                min(255, (int) ($b + 60 * $t)),
            );
            imageline($img, 0, $y, $w, $y, $row);
        }

        // Two soft circles for depth.
        [$cr, $cg, $cb] = self::hslToRgb(fmod($hue + 0.07, 1.0), 0.65, 0.55);
        imagefilledellipse(
            $img,
            (int) ($w * 0.88),
            (int) ($h * 0.12),
            (int) ($w * 0.75),
            (int) ($w * 0.75),
            imagecolorallocatealpha($img, $cr, $cg, $cb, 112),
        );
        imagefilledellipse(
            $img,
            (int) ($w * 0.08),
            (int) ($h * 0.92),
            (int) ($w * 0.6),
            (int) ($w * 0.6),
            imagecolorallocatealpha($img, $cr, $cg, $cb, 118),
        );

        // Hairline frame.
        imagerectangle($img, 12, 12, $w - 13, $h - 13, imagecolorallocatealpha($img, 255, 255, 255, 92));

        return $img;
    }

    /**
     * Light studio backdrop for product shots: subtly tinted wall gradient,
     * a soft spotlight glow behind the subject, a floor band with a faint
     * seam, and a layered contact shadow the glyph sits on.
     *
     * @return \GdImage|null
     */
    private static function paintStudio(float $hue, int $w, int $h)
    {
        $img = imagecreatetruecolor($w, $h);
        if ($img === false) {
            return null;
        }

        [$wr, $wg, $wb] = self::hslToRgb(fmod($hue + 0.5, 1.0), 0.30, 0.975);
        [$fr, $fg, $fb] = self::hslToRgb(fmod($hue + 0.5, 1.0), 0.22, 0.88);
        $floorY = (int) ($h * 0.70);

        // Wall: near-white, easing into the tinted floor line.
        for ($y = 0; $y < $floorY; $y++) {
            $k = $y / max(1, $floorY);
            $row = imagecolorallocate(
                $img,
                (int) ($wr - ($wr - $fr) * $k),
                (int) ($wg - ($wg - $fg) * $k),
                (int) ($wb - ($wb - $fb) * $k),
            );
            imageline($img, 0, $y, $w, $y, $row);
        }

        // Floor: a touch deeper than the wall so the seam reads.
        [$br, $bg, $bb] = self::hslToRgb(fmod($hue + 0.5, 1.0), 0.20, 0.78);
        for ($y = $floorY; $y < $h; $y++) {
            $k = ($y - $floorY) / max(1, $h - $floorY);
            $row = imagecolorallocate(
                $img,
                (int) ($fr - ($fr - $br) * $k),
                (int) ($fg - ($fg - $bg) * $k),
                (int) ($fb - ($fb - $bb) * $k),
            );
            imageline($img, 0, $y, $w, $y, $row);
        }

        // Spotlight glow behind the subject (stacked translucent whites).
        foreach ([[0.94, 0.62, 121], [0.78, 0.50, 116], [0.62, 0.40, 111]] as [$ew, $eh, $alpha]) {
            imagefilledellipse(
                $img,
                (int) ($w / 2),
                (int) ($h * 0.40),
                (int) ($w * $ew),
                (int) ($h * $eh),
                imagecolorallocatealpha($img, 255, 255, 255, $alpha),
            );
        }

        // Floor seam.
        imagefilledrectangle($img, 0, $floorY, $w, $floorY + 2, imagecolorallocatealpha($img, 70, 72, 84, 112));

        // Contact shadow under the product (three soft passes).
        foreach ([[0.52, 0.10, 102], [0.42, 0.08, 96], [0.32, 0.06, 90]] as [$sw, $sh, $alpha]) {
            imagefilledellipse(
                $img,
                (int) ($w / 2),
                (int) ($h * 0.70),
                (int) ($w * $sw),
                (int) ($h * $sh),
                imagecolorallocatealpha($img, 40, 42, 54, $alpha),
            );
        }

        return $img;
    }

    private static function drawHeadline(
        \GdImage $img,
        float $hue,
        string $title,
        string $eyebrow,
        int $cx,
        int $topY,
        int $w,
        int $h,
    ): void {
        $fontSize = max(34, (int) (min($w, $h) * 0.062));
        $maxTextWidth = (int) ($w * 0.84);
        $lines = self::wrap($title, $fontSize, $maxTextWidth, 3);
        $lineH = self::lineHeight($fontSize);

        $eyebrowText = strtoupper($eyebrow);
        $eyebrowSize = max(20, (int) ($fontSize * 0.5));
        $blockH = $lineH * count($lines) + ($eyebrowText !== '' ? $eyebrowSize + 18 : 0);

        $startY = $topY;
        if ($startY + $blockH > $h - 44) {
            $startY = max(24, $h - 44 - $blockH);
        }

        if ($eyebrowText !== '') {
            [$er, $eg, $eb] = self::hslToRgb(fmod($hue + 0.5, 1.0), 0.72, 0.78);
            self::drawCentered($img, $eyebrowText, $cx, $startY, $eyebrowSize, imagecolorallocate($img, $er, $eg, $eb), false);
            $startY += $eyebrowSize + 18;
        }

        $white = imagecolorallocate($img, 255, 255, 255);
        foreach ($lines as $i => $line) {
            self::drawCentered($img, $line, $cx, $startY + $i * $lineH, $fontSize, $white, true);
        }
    }

    /**
     * Subject glyph drawn inside the given box.
     *
     * Default look: translucent white ink on dark gradients — details
     * brighten and lines darken relative to the base alpha.
     *
     * Pass $inkRgb (opaque color) instead for studio product shots: the glyph
     * is rendered as a shaded object using $detailRgb as highlight facets and
     * $lineRgb as shadow facets (they default to the base color).
     *
     * @param  int  $alpha  Base alpha (0 opaque .. 127 transparent).
     * @param  array{0:int,1:int,2:int}|null  $inkRgb
     * @param  array{0:int,1:int,2:int}|null  $detailRgb
     * @param  array{0:int,1:int,2:int}|null  $lineRgb
     */
    private static function drawGlyph(
        \GdImage $img,
        string $glyph,
        int $cx,
        int $cy,
        int $size,
        int $alpha,
        ?array $inkRgb = null,
        ?array $detailRgb = null,
        ?array $lineRgb = null,
    ): void {
        if ($inkRgb !== null) {
            $detailRgb ??= $inkRgb;
            $lineRgb ??= $inkRgb;
            $ink = imagecolorallocate($img, $inkRgb[0], $inkRgb[1], $inkRgb[2]);
            $detail = imagecolorallocate($img, $detailRgb[0], $detailRgb[1], $detailRgb[2]);
            $line = imagecolorallocate($img, $lineRgb[0], $lineRgb[1], $lineRgb[2]);
        } else {
            $ink = imagecolorallocatealpha($img, 255, 255, 255, $alpha);
            $detail = imagecolorallocatealpha($img, 255, 255, 255, max(0, $alpha - 26));
            $line = imagecolorallocatealpha($img, 255, 255, 255, min(127, $alpha + 14));
        }

        $s = $size;
        $gh = (int) ($size * 0.72);
        $x1 = $cx - (int) ($s / 2);
        $x2 = $cx + (int) ($s / 2);
        $y1 = $cy - (int) ($gh / 2);
        $y2 = $cy + (int) ($gh / 2);

        switch ($glyph) {
            case 'shirt':
                // T-shirt: shoulders, short sleeves, body.
                imagepolygon($img, [
                    $cx - (int) ($s * 0.14), $y1,
                    $cx + (int) ($s * 0.14), $y1,
                    $x2, $y1 + (int) ($gh * 0.26),
                    $x2 - (int) ($s * 0.08), $y1 + (int) ($gh * 0.46),
                    $x1 + (int) ($s * 0.32), $y1 + (int) ($gh * 0.46),
                    $x1, $y1 + (int) ($gh * 0.26),
                ], $ink);
                imagefilledpolygon($img, [
                    $x1 + (int) ($s * 0.32), $y1 + (int) ($gh * 0.40),
                    $x2 - (int) ($s * 0.32), $y1 + (int) ($gh * 0.40),
                    $x2 - (int) ($s * 0.34), $y2,
                    $x1 + (int) ($s * 0.34), $y2,
                ], $ink);
                imagefilledellipse($img, $cx, $y1 + (int) ($gh * 0.06), (int) ($s * 0.26), (int) ($gh * 0.18), $detail);
                break;

            case 'pants':
                // Waistband + two legs with a gap.
                imagefilledrectangle($img, $cx - (int) ($s * 0.30), $y1, $cx + (int) ($s * 0.30), $y1 + (int) ($gh * 0.18), $ink);
                imagefilledrectangle($img, $cx - (int) ($s * 0.28), $y1 + (int) ($gh * 0.10), $cx - (int) ($s * 0.03), $y2, $ink);
                imagefilledrectangle($img, $cx + (int) ($s * 0.03), $y1 + (int) ($gh * 0.10), $cx + (int) ($s * 0.28), $y2, $ink);
                imagefilledrectangle($img, $cx - (int) ($s * 0.30), $y1 + (int) ($gh * 0.06), $cx + (int) ($s * 0.30), $y1 + (int) ($gh * 0.11), $detail);
                break;

            case 'dress':
                // Fitted bodice flaring into a skirt.
                imagepolygon($img, [
                    $cx - (int) ($s * 0.11), $y1,
                    $cx + (int) ($s * 0.11), $y1,
                    $cx + (int) ($s * 0.14), $cy - (int) ($gh * 0.05),
                    $cx - (int) ($s * 0.14), $cy - (int) ($gh * 0.05),
                ], $ink);
                imagepolygon($img, [
                    $cx - (int) ($s * 0.14), $cy - (int) ($gh * 0.02),
                    $cx + (int) ($s * 0.14), $cy - (int) ($gh * 0.02),
                    $x2, $y2,
                    $x1, $y2,
                ], $ink);
                imagearc($img, $cx, $y1 + (int) ($gh * 0.02), (int) ($s * 0.22), (int) ($gh * 0.16), 180, 360, $detail);
                break;

            case 'shoe':
                // Sneaker: upper + toe cap + sole.
                imagepolygon($img, [
                    $x1 + (int) ($s * 0.14), $cy + (int) ($gh * 0.04),
                    $x1 + (int) ($s * 0.22), $y1 + (int) ($gh * 0.14),
                    $cx + (int) ($s * 0.04), $y1 + (int) ($gh * 0.06),
                    $x2 - (int) ($s * 0.06), $cy - (int) ($gh * 0.02),
                    $x2 - (int) ($s * 0.04), $cy + (int) ($gh * 0.10),
                ], $ink);
                imagefilledellipse($img, $x1 + (int) ($s * 0.20), $cy + (int) ($gh * 0.08), (int) ($s * 0.24), (int) ($gh * 0.22), $ink);
                imagefilledrectangle($img, $x1, $cy + (int) ($gh * 0.12), $x2, $cy + (int) ($gh * 0.24), $detail);
                break;

            case 'phone':
                // Smartphone: rounded body, screen strip, speaker dot.
                imagefilledrectangle($img, $cx - (int) ($s * 0.17), $y1, $cx + (int) ($s * 0.17), $y2, $ink);
                imagefilledrectangle($img, $cx - (int) ($s * 0.13), $y1 + (int) ($gh * 0.10), $cx + (int) ($s * 0.13), $y2 - (int) ($gh * 0.10), $line);
                imagefilledellipse($img, $cx, $y1 + (int) ($gh * 0.05), (int) ($s * 0.05), (int) ($s * 0.05), $detail);
                imagefilledellipse($img, $cx, $y2 - (int) ($gh * 0.04), (int) ($gh * 0.05), (int) ($gh * 0.05), $detail);
                break;

            case 'laptop':
                // Screen + keyboard base.
                imagefilledrectangle($img, $x1 + (int) ($s * 0.14), $y1, $x2 - (int) ($s * 0.14), $cy - (int) ($gh * 0.02), $ink);
                imagefilledrectangle($img, $x1 + (int) ($s * 0.18), $y1 + (int) ($gh * 0.06), $x2 - (int) ($s * 0.18), $cy - (int) ($gh * 0.08), $line);
                imagepolygon($img, [
                    $x1, $cy + (int) ($gh * 0.22),
                    $x2, $cy + (int) ($gh * 0.22),
                    $x2 - (int) ($s * 0.06), $cy,
                    $x1 + (int) ($s * 0.06), $cy,
                ], $ink);
                imagefilledrectangle($img, $cx - (int) ($s * 0.10), $cy + (int) ($gh * 0.06), $cx + (int) ($s * 0.10), $cy + (int) ($gh * 0.10), $detail);
                break;

            case 'headphones':
                // Headband arc + ear cups.
                for ($i = 0; $i < 3; $i++) {
                    $pad = $i * 7;
                    imagearc($img, $cx, $cy - (int) ($gh * 0.06), (int) ($s * 0.66) - $pad * 2, (int) ($gh * 0.90) - $pad * 2, 180, 360, $line);
                }
                imagefilledellipse($img, $x1 + (int) ($s * 0.16), $cy + (int) ($gh * 0.08), (int) ($s * 0.16), (int) ($gh * 0.44), $ink);
                imagefilledellipse($img, $x2 - (int) ($s * 0.16), $cy + (int) ($gh * 0.08), (int) ($s * 0.16), (int) ($gh * 0.44), $ink);
                imagefilledellipse($img, $x1 + (int) ($s * 0.16), $cy + (int) ($gh * 0.08), (int) ($s * 0.06), (int) ($gh * 0.16), $detail);
                imagefilledellipse($img, $x2 - (int) ($s * 0.16), $cy + (int) ($gh * 0.08), (int) ($s * 0.06), (int) ($gh * 0.16), $detail);
                break;

            case 'watch':
                // Round face on a vertical strap.
                imagefilledrectangle($img, $cx - (int) ($s * 0.09), $y1, $cx + (int) ($s * 0.09), $y2, $detail);
                imagefilledellipse($img, $cx, $cy, (int) ($s * 0.42), (int) ($s * 0.42), $ink);
                imagefilledellipse($img, $cx, $cy, (int) ($s * 0.30), (int) ($s * 0.30), $line);
                imagefilledrectangle($img, $cx - 2, $cy - (int) ($gh * 0.10), $cx + 2, $cy, $ink);
                imagefilledrectangle($img, $cx, $cy - 2, $cx + (int) ($s * 0.09), $cy + 2, $ink);
                break;

            case 'tv':
                // Widescreen panel + stand.
                imagefilledrectangle($img, $x1, $y1 + (int) ($gh * 0.06), $x2, $cy + (int) ($gh * 0.10), $ink);
                imagefilledrectangle($img, $x1 + (int) ($s * 0.05), $y1 + (int) ($gh * 0.13), $x2 - (int) ($s * 0.05), $cy + (int) ($gh * 0.02), $line);
                imagefilledrectangle($img, $cx - (int) ($s * 0.06), $cy + (int) ($gh * 0.10), $cx + (int) ($s * 0.06), $y2, $detail);
                imagefilledrectangle($img, $cx - (int) ($s * 0.18), $y2, $cx + (int) ($s * 0.18), $y2 + (int) ($gh * 0.06), $detail);
                break;

            case 'camera':
                // Body + lens + viewfinder hump.
                imagefilledrectangle($img, $x1, $cy - (int) ($gh * 0.14), $x2, $cy + (int) ($gh * 0.26), $ink);
                imagefilledrectangle($img, $cx - (int) ($s * 0.14), $y1 + (int) ($gh * 0.02), $cx + (int) ($s * 0.10), $cy - (int) ($gh * 0.10), $detail);
                imagefilledellipse($img, $cx, $cy + (int) ($gh * 0.06), (int) ($s * 0.34), (int) ($s * 0.34), $detail);
                imagefilledellipse($img, $cx, $cy + (int) ($gh * 0.06), (int) ($s * 0.20), (int) ($s * 0.20), $line);
                imagefilledellipse($img, $cx, $cy + (int) ($gh * 0.06), (int) ($s * 0.08), (int) ($s * 0.08), $ink);
                break;

            case 'sofa':
                // Backrest, two arms, seat and legs.
                imagefilledrectangle($img, $x1 + (int) ($s * 0.08), $y1 + (int) ($gh * 0.04), $x2 - (int) ($s * 0.08), $cy - (int) ($gh * 0.04), $ink);
                imagefilledrectangle($img, $x1, $cy - (int) ($gh * 0.16), $x1 + (int) ($s * 0.14), $cy + (int) ($gh * 0.18), $detail);
                imagefilledrectangle($img, $x2 - (int) ($s * 0.14), $cy - (int) ($gh * 0.16), $x2, $cy + (int) ($gh * 0.18), $detail);
                imagefilledrectangle($img, $x1, $cy + (int) ($gh * 0.02), $x2, $cy + (int) ($gh * 0.24), $ink);
                imagefilledrectangle($img, $x1 + 6, $cy + (int) ($gh * 0.24), $x1 + (int) ($s * 0.10), $y2, $detail);
                imagefilledrectangle($img, $x2 - (int) ($s * 0.10), $cy + (int) ($gh * 0.24), $x2 - 6, $y2, $detail);
                break;

            case 'pot':
                // Cooking pot: lid, body, side handles.
                imagefilledellipse($img, $cx, $y1 + (int) ($gh * 0.08), (int) ($s * 0.62), (int) ($gh * 0.22), $ink);
                imagefilledrectangle($img, $cx - (int) ($s * 0.02), $y1, $cx + (int) ($s * 0.02), $y1 + (int) ($gh * 0.06), $detail);
                imagefilledrectangle($img, $cx - (int) ($s * 0.32), $y1 + (int) ($gh * 0.16), $cx + (int) ($s * 0.32), $y2 - (int) ($gh * 0.06), $ink);
                imagefilledellipse($img, $cx - (int) ($s * 0.36), $cy + (int) ($gh * 0.16), (int) ($s * 0.10), (int) ($gh * 0.14), $detail);
                imagefilledellipse($img, $cx + (int) ($s * 0.36), $cy + (int) ($gh * 0.16), (int) ($s * 0.10), (int) ($gh * 0.14), $detail);
                imagefilledrectangle($img, $cx - (int) ($s * 0.32), $y2 - (int) ($gh * 0.10), $cx + (int) ($s * 0.32), $y2 - (int) ($gh * 0.06), $detail);
                break;

            case 'bottle':
                // Pump bottle: cap, neck, shoulders, body.
                imagefilledrectangle($img, $cx - (int) ($s * 0.08), $y1, $cx + (int) ($s * 0.08), $y1 + (int) ($gh * 0.12), $detail);
                imagefilledrectangle($img, $cx - (int) ($s * 0.05), $y1 + (int) ($gh * 0.12), $cx + (int) ($s * 0.05), $y1 + (int) ($gh * 0.22), $ink);
                imagefilledpolygon($img, [
                    $cx - (int) ($s * 0.05), $y1 + (int) ($gh * 0.20),
                    $cx + (int) ($s * 0.05), $y1 + (int) ($gh * 0.20),
                    $cx + (int) ($s * 0.24), $y1 + (int) ($gh * 0.36),
                    $cx - (int) ($s * 0.24), $y1 + (int) ($gh * 0.36),
                ], $ink);
                imagefilledrectangle($img, $cx - (int) ($s * 0.24), $y1 + (int) ($gh * 0.34), $cx + (int) ($s * 0.24), $y2, $ink);
                imagefilledrectangle($img, $cx - (int) ($s * 0.14), $cy + (int) ($gh * 0.10), $cx + (int) ($s * 0.14), $cy + (int) ($gh * 0.24), $line);
                break;

            case 'plant':
                // Potted seedling: pot + stem + leaves.
                imagefilledpolygon($img, [
                    $cx - (int) ($s * 0.22), $cy + (int) ($gh * 0.10),
                    $cx + (int) ($s * 0.22), $cy + (int) ($gh * 0.10),
                    $cx + (int) ($s * 0.15), $y2,
                    $cx - (int) ($s * 0.15), $y2,
                ], $ink);
                imagefilledrectangle($img, $cx - 4, $y1 + (int) ($gh * 0.10), $cx + 4, $cy + (int) ($gh * 0.12), $detail);
                imagefilledellipse($img, $cx - (int) ($s * 0.14), $y1 + (int) ($gh * 0.18), (int) ($s * 0.30), (int) ($gh * 0.16), $ink);
                imagefilledellipse($img, $cx + (int) ($s * 0.14), $y1 + (int) ($gh * 0.30), (int) ($s * 0.30), (int) ($gh * 0.16), $ink);
                break;

            case 'ball':
                // Ball with two seam curves.
                imagefilledellipse($img, $cx, $cy, (int) ($s * 0.72), (int) ($s * 0.72), $ink);
                imagearc($img, $cx - (int) ($s * 0.20), $cy, (int) ($s * 0.50), (int) ($s * 0.66), 270, 90, $detail);
                imagearc($img, $cx + (int) ($s * 0.20), $cy, (int) ($s * 0.50), (int) ($s * 0.66), 90, 270, $detail);
                break;

            case 'toy':
                // Teddy bear: ears, head, body, arms.
                imagefilledellipse($img, $x1 + (int) ($s * 0.24), $y1 + (int) ($gh * 0.12), (int) ($s * 0.22), (int) ($s * 0.22), $ink);
                imagefilledellipse($img, $x2 - (int) ($s * 0.24), $y1 + (int) ($gh * 0.12), (int) ($s * 0.22), (int) ($s * 0.22), $ink);
                imagefilledellipse($img, $cx, $y1 + (int) ($gh * 0.26), (int) ($s * 0.42), (int) ($gh * 0.42), $ink);
                imagefilledellipse($img, $cx, $y2 - (int) ($gh * 0.18), (int) ($s * 0.56), (int) ($gh * 0.60), $ink);
                imagefilledellipse($img, $cx - (int) ($s * 0.34), $cy + (int) ($gh * 0.06), (int) ($s * 0.20), (int) ($gh * 0.24), $detail);
                imagefilledellipse($img, $cx + (int) ($s * 0.34), $cy + (int) ($gh * 0.06), (int) ($s * 0.20), (int) ($gh * 0.24), $detail);
                imagefilledellipse($img, $cx, $cy + (int) ($gh * 0.02), (int) ($s * 0.14), (int) ($gh * 0.12), $line);
                break;

            case 'bed':
                // Headboard, mattress, pillow, legs.
                imagefilledrectangle($img, $x1, $y1, $x1 + (int) ($s * 0.06), $y2, $ink);
                imagefilledrectangle($img, $x1 + (int) ($s * 0.06), $cy, $x2, $y2, $ink);
                imagefilledrectangle(
                    $img,
                    $x1 + (int) ($s * 0.10),
                    $cy - (int) ($gh * 0.16),
                    $cx - (int) ($s * 0.16),
                    $cy + (int) ($gh * 0.04),
                    $detail,
                );
                imagefilledrectangle($img, $x1 + 6, $y2, $x1 + (int) ($s * 0.12), $y2 + (int) ($gh * 0.12), $ink);
                imagefilledrectangle($img, $x2 - (int) ($s * 0.12), $y2, $x2 - 6, $y2 + (int) ($gh * 0.12), $ink);
                break;

            case 'food':
                // Fork (left) + knife (right).
                for ($i = 0; $i < 3; $i++) {
                    $tx = $x1 + (int) ($s * 0.05) + $i * (int) ($s * 0.09);
                    imagefilledrectangle($img, $tx, $y1, $tx + (int) ($s * 0.045), $cy - (int) ($gh * 0.10), $ink);
                }
                imagefilledrectangle($img, $x1 + (int) ($s * 0.04), $cy - (int) ($gh * 0.16), $x1 + (int) ($s * 0.30), $cy - (int) ($gh * 0.06), $ink);
                imagefilledrectangle($img, $x1 + (int) ($s * 0.13), $cy - (int) ($gh * 0.06), $x1 + (int) ($s * 0.21), $y2, $ink);
                imagefilledrectangle($img, $x2 - (int) ($s * 0.16), $y1 + (int) ($gh * 0.14), $x2 - (int) ($s * 0.07), $cy, $ink);
                imagefilledellipse($img, $x2 - (int) ($s * 0.115), $y1 + (int) ($gh * 0.14), (int) ($s * 0.09), (int) ($s * 0.09), $ink);
                imagefilledrectangle($img, $x2 - (int) ($s * 0.13), $cy, $x2 - (int) ($s * 0.10), $y2, $ink);
                break;

            case 'book':
                // Open book: two pages + bright spine.
                imagepolygon($img, [
                    $cx, $y1 + (int) ($gh * 0.10),
                    $x1 + (int) ($s * 0.04), $y1,
                    $x1 + (int) ($s * 0.04), $y2 - (int) ($gh * 0.08),
                    $cx, $y2 - (int) ($gh * 0.18),
                ], $ink);
                imagepolygon($img, [
                    $cx, $y1 + (int) ($gh * 0.10),
                    $x2 - (int) ($s * 0.04), $y1,
                    $x2 - (int) ($s * 0.04), $y2 - (int) ($gh * 0.08),
                    $cx, $y2 - (int) ($gh * 0.18),
                ], $ink);
                imagefilledrectangle($img, $cx - 3, $y1 + (int) ($gh * 0.12), $cx + 3, $y2 - (int) ($gh * 0.16), $detail);
                break;

            case 'house':
                imagepolygon($img, [$cx, $y1, $x2, $cy - (int) ($gh * 0.06), $x1, $cy - (int) ($gh * 0.06)], $ink);
                imagefilledrectangle($img, $x1 + (int) ($s * 0.12), $cy - (int) ($gh * 0.06), $x2 - (int) ($s * 0.12), $y2, $ink);
                imagefilledrectangle($img, $cx - (int) ($s * 0.08), $cy + (int) ($gh * 0.10), $cx + (int) ($s * 0.08), $y2, $detail);
                break;

            case 'pill':
                imagefilledrectangle($img, $cx - (int) ($s * 0.30), $cy - (int) ($gh * 0.17), $cx + (int) ($s * 0.30), $cy + (int) ($gh * 0.17), $ink);
                imagefilledellipse($img, $cx - (int) ($s * 0.30), $cy, (int) ($gh * 0.34), (int) ($gh * 0.34), $ink);
                imagefilledellipse($img, $cx + (int) ($s * 0.30), $cy, (int) ($gh * 0.34), (int) ($gh * 0.34), $ink);
                imagefilledrectangle($img, $cx - 4, $cy - (int) ($gh * 0.17), $cx + 4, $cy + (int) ($gh * 0.17), $detail);
                break;

            case 'bag':
                // Shopping bag body + arc handle (3 concentric strokes).
                imagepolygon($img, [
                    $x1 + (int) ($s * 0.06), $y1 + (int) ($gh * 0.26),
                    $x2 - (int) ($s * 0.06), $y1 + (int) ($gh * 0.26),
                    $x2, $y2,
                    $x1, $y2,
                ], $ink);
                for ($i = 0; $i < 3; $i++) {
                    $pad = $i * 4;
                    imagearc($img, $cx, $y1 + (int) ($gh * 0.28), (int) ($s * 0.34) - $pad * 2, (int) ($gh * 0.50) - $pad * 2, 180, 360, $line);
                }
                break;

            case 'user':
                // Portrait silhouette for avatar slots (round crops): head
                // resting on a half-body torso.
                $headD = (int) ($gh * 0.52);
                imagefilledellipse($img, $cx, $y1 + (int) ($headD * 0.55), $headD, $headD, $ink);
                imagefilledellipse($img, $cx, $y2 - (int) ($gh * 0.06), (int) ($s * 0.78), (int) ($gh * 0.80), $ink);
                break;

            case 'star':
                $points = [];
                $outer = $s * 0.42;
                $inner = $s * 0.17;
                for ($i = 0; $i < 10; $i++) {
                    $rad = ($i % 2 === 0) ? $outer : $inner;
                    $ang = deg2rad(-90 + $i * 36);
                    $points[] = (int) round($cx + cos($ang) * $rad);
                    $points[] = (int) round($cy + sin($ang) * $rad);
                }
                imagefilledpolygon($img, $points, $ink);
                break;

            default:
                // 'box' — package with lid band and tape stripe.
                imagefilledrectangle($img, $x1, $y1 + (int) ($gh * 0.22), $x2, $y2, $ink);
                imagefilledrectangle($img, $x1, $y1, $x2, $y1 + (int) ($gh * 0.22), $detail);
                imagefilledrectangle($img, $cx - (int) ($s * 0.035), $y1, $cx + (int) ($s * 0.035), $y2, $detail);
                break;
        }
    }

    /** @return list<string> */
    private static function wrap(string $text, int $size, int $maxWidth, int $maxLines): array
    {
        $words = preg_split('/\s+/', $text) ?: [];
        $words = array_values(array_filter($words, static fn (string $w): bool => $w !== ''));
        if ($words === []) {
            return [$text];
        }

        $lines = [];
        $current = '';
        foreach ($words as $word) {
            // Hard-break single words that cannot fit a line at all.
            if ($current === '' && self::textWidth($word, $size) > $maxWidth) {
                $chunk = '';
                foreach (str_split($word) as $ch) {
                    if ($chunk !== '' && self::textWidth($chunk.$ch, $size) > $maxWidth) {
                        $lines[] = $chunk;
                        $chunk = $ch;
                    } else {
                        $chunk .= $ch;
                    }
                }
                $current = $chunk;
                continue;
            }

            $candidate = $current === '' ? $word : $current.' '.$word;
            if ($current !== '' && self::textWidth($candidate, $size) > $maxWidth) {
                $lines[] = $current;
                $current = $word;
            } else {
                $current = $candidate;
            }
        }
        if ($current !== '') {
            $lines[] = $current;
        }

        if (count($lines) > $maxLines) {
            $lines = array_slice($lines, 0, $maxLines);
            $lastIdx = $maxLines - 1;
            $last = $lines[$lastIdx];
            while ($last !== '' && self::textWidth($last.'...', $size) > $maxWidth) {
                $trimmed = preg_replace('/\s*\S$/', '', $last);
                $last = $trimmed === null || $trimmed === '' ? '' : $trimmed;
            }
            $lines[$lastIdx] = $last === '' ? '...' : $last.'...';
        }

        return $lines;
    }

    private static function textWidth(string $text, int $size): int
    {
        $font = self::font();
        if ($font !== null) {
            $bbox = imagettfbbox($size, 0, $font, $text);
            if ($bbox !== false) {
                return (int) abs($bbox[2] - $bbox[0]);
            }
        }

        return imagefontwidth(self::BUILTIN_FONT) * strlen($text);
    }

    private static function lineHeight(int $size): int
    {
        return self::font() !== null ? (int) ($size * 1.28) : 20;
    }

    private static function drawCentered(
        \GdImage $img,
        string $text,
        int $cx,
        int $yTop,
        int $size,
        int $color,
        bool $shadow,
    ): void {
        if ($text === '') {
            return;
        }

        $font = self::font();
        if ($font !== null) {
            $bbox = imagettfbbox($size, 0, $font, $text);
            if ($bbox === false) {
                return;
            }
            $x = (int) round($cx - ($bbox[2] + $bbox[0]) / 2);
            // bbox[7] is the glyph top (negative, above baseline); anchoring
            // on bbox[1] (descent) would bottom-align the line to $yTop and
            // collide with the eyebrow label above it.
            $baseline = $yTop - $bbox[7];
            if ($shadow) {
                $dark = imagecolorallocatealpha($img, 0, 0, 0, 55);
                imagettftext($img, $size, 0, $x + 2, $baseline + 3, $dark, $font, $text);
            }
            imagettftext($img, $size, 0, $x, $baseline, $color, $font, $text);

            return;
        }

        // Last resort: built-in font, roughly centered.
        $width = imagefontwidth(self::BUILTIN_FONT) * strlen($text);
        imagestring($img, self::BUILTIN_FONT, $cx - (int) ($width / 2), $yTop, $text, $color);
    }

    private static function font(): ?string
    {
        if (! self::$fontResolved) {
            self::$fontResolved = true;
            foreach (self::FONT_CANDIDATES as $path) {
                if (is_file($path)) {
                    self::$font = $path;
                    break;
                }
            }
        }

        return self::$font;
    }

    private static function png(\GdImage $img): ?string
    {
        ob_start();
        $ok = imagepng($img);
        $bytes = ob_get_clean();
        imagedestroy($img);

        return $ok && is_string($bytes) && $bytes !== '' ? $bytes : null;
    }

    /** @return array{0:int,1:int,2:int} */
    private static function hslToRgb(float $h, float $s, float $l): array
    {
        $c = (1 - abs(2 * $l - 1)) * $s;
        $x = $c * (1 - abs(fmod($h * 6, 2) - 1));
        $m = $l - $c / 2;

        [$r, $g, $b] = match ((int) floor($h * 6) % 6) {
            0 => [$c, $x, 0],
            1 => [$x, $c, 0],
            2 => [0, $c, $x],
            3 => [0, $x, $c],
            4 => [$x, 0, $c],
            default => [$c, 0, $x],
        };

        return [(int) round(($r + $m) * 255), (int) round(($g + $m) * 255), (int) round(($b + $m) * 255)];
    }
}
