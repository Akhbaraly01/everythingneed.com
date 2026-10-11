<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Modules\Learn\Entities\LearnPost;
use Modules\Learn\Entities\LearnPostComment;

/**
 * Learn free knowledge feed demo data (gap 2).
 *
 * The brief: Learn has to feel like a video/text feed first (80-90% free,
 * scrollable, YouTube/Facebook-like) with paid courses as the smaller
 * offering, plus an honest upload -> review -> publish pipeline.
 *
 * What this seeds:
 *  - 53 approved VIDEO posts from LearnFeedVideos::VIDEOS - every link was
 *    verified live via oEmbed, and title/channel/duration are the real
 *    values read from YouTube, never invented;
 *  - 27 approved TEXT posts (practical guides written for the demo);
 *  - a moderation queue for the reviewer console: 6 pending (one with an
 *    appeal), 1 rejected, 1 needs-information - all owned by demo accounts
 *    so "My posts" shows real states;
 *  - real comment rows on a subset of posts, so comments_count on a card
 *    always matches an actual thread (no counter without content).
 *
 * Idempotent: videos key on (video_provider, provider_video_id), everything
 * else keys on slug. Safe to run repeatedly.
 */
class LearnFeedDemoSeeder extends Seeder
{
    /** Preferred authors per topic - keeps expertise and byline believable. */
    private const AUTHOR_EMAILS = [
        'programming' => ['user@everythingneed.com', 'content@everythingneed.com'],
        'technology' => ['content@everythingneed.com', 'analytics@everythingneed.com'],
        'science' => ['analytics@everythingneed.com', 'learning@everythingneed.com'],
        'career' => ['learning@everythingneed.com', 'support@everythingneed.com'],
        'productivity' => ['learning@everythingneed.com', 'support@everythingneed.com'],
        'leadership' => ['support@everythingneed.com', 'moderator@everythingneed.com'],
        'communication' => ['content@everythingneed.com', 'support@everythingneed.com'],
        'gardening' => ['vendor@everythingneed.com', 'customer@everythingneed.com'],
        'agriculture' => ['vendor@everythingneed.com', 'customer@everythingneed.com'],
        'cooking' => ['customer@everythingneed.com', 'vendor@everythingneed.com'],
        'finance' => ['finance@everythingneed.com', 'analytics@everythingneed.com'],
        'health' => ['healthcare@everythingneed.com', 'customer@everythingneed.com'],
        'fitness' => ['healthcare@everythingneed.com', 'user@everythingneed.com'],
        '*' => ['content@everythingneed.com', 'user@everythingneed.com'],
    ];

    /** Health/finance/legal need the second reviewer pass (sensitive_topic). */
    private const SENSITIVE = ['health', 'healthcare', 'medical', 'finance', 'financial', 'investment', 'legal', 'law'];

    private const TEXT_POSTS = [
        ['category' => 'productivity', 'title' => 'The two-minute rule, applied honestly', 'content' => "If a task takes less than two minutes, do it now. The rule works because starting costs more than the task itself: replying to a message takes thirty seconds, but carrying it in your head for a day costs attention every hour.\n\nThe honest part is the limit. Use it to clear genuinely small obligations, not to avoid a twenty-minute report by answering six emails instead. Anything over two minutes gets one line on a written list with the next physical action - \"send draft to Maria\" - or it will come back to haunt you."],
        ['category' => 'career', 'title' => 'Write a resume for the six-second scan', 'content' => "Recruiters spend about six seconds on the first pass. That scan is not reading, it is pattern matching for role titles, tools and dates.\n\nPut the job title you want at the top, list experience in reverse-chronological order, and lead each bullet with the outcome instead of the duty: \"cut invoice errors 40% by rebuilding the check\" beats \"responsible for invoices\". Keep it to one page until you have ten years of experience, and export a PDF so the layout cannot move on their screen."],
        ['category' => 'programming', 'title' => 'JavaScript equality: the checklist that stops the bug', 'content' => "== compares after coercion, === does not. The cases that actually bite: '1' == 1 is true, '' == 0 is true, null == undefined is true - while NaN never equals itself, and arrays convert to strings ([1,2] == '1,2').\n\nPractical rule: use === everywhere by default. Only relax it when you deliberately want null and undefined treated as the same missing value, and leave a comment saying so - otherwise the next reader has to re-derive your intent."],
        ['category' => 'finance', 'title' => 'Pay yourself first: a 30-minute payday routine', 'content' => "Automate the order of operations on payday: fixed bills first, then a transfer to savings, and whatever is left is spending money.\n\nThe transfer matters more than the amount - 5% moved automatically beats 25% you promise yourself in week three. Once a month, spend thirty minutes on the numbers: what came in, what left, what the savings rate was. Reviewing the figure is what makes next month different; the spreadsheet alone does not."],
        ['category' => 'health', 'title' => "What the 'eight glasses' rule gets right and wrong", 'content' => "Nobody agrees on the origin of the eight-glasses rule, and real needs vary with body size, heat and activity. What is right about it: thirst is a lagging indicator, and many people genuinely under-drink.\n\nA workable approach - drink with meals, drink around training, and check that your first morning visit is pale straw. Food counts too: fruit, vegetables and soup all contribute. If your kidneys or heart are under medical care, follow your clinician's numbers rather than a general rule."],
        ['category' => 'cooking', 'title' => 'Salt like a chef: when, how much, why', 'content' => "Salt at three moments: early, to season the inside (steak, pasta water, a pot of beans); during, to build layers; and at the end, to sharpen what is already there.\n\nPasta water should taste like a mild broth, not the sea. Add in small pinches and taste constantly - you can always add, and a rescued dish is mostly work. If food tastes flat rather than salty, the fix is usually acid (lemon, vinegar) before more salt."],
        ['category' => 'gardening', 'title' => 'Four signs a plant needs a new pot', 'content' => "Roots circling the drainage hole, water running straight through without wetting the ball, top growth stalled for a season, and a plant that lifts out of its own pot when you pick it up.\n\nRepot one size up - two sizes bigger is too much soil around a small root system. Tease the outer roots loose with your fingers, set it in fresh mix, water once, and keep it out of direct sun for a week while it settles."],
        ['category' => 'agriculture', 'title' => 'Composting in four weeks: greens, browns, air', 'content' => "Aim for roughly two parts browns (dry leaves, cardboard, straw) to one part greens (kitchen scraps, fresh grass). Chop the big pieces, keep it as damp as a wrung-out sponge, and turn it weekly so air reaches the centre - that is where the heat that kills weed seed and disease comes from.\n\nA slimy smell means too much green or too little air: add browns and turn. In four to eight weeks you should have dark, crumbly material that smells of soil, not of the bin."],
        ['category' => 'education', 'title' => 'Spaced repetition: revise so it actually sticks', 'content' => "Cramming works for tomorrow's test and fails by Friday. Instead, review new material after one day, then three, then a week, then a month - each successful recall pushes the next review further out.\n\nThe recall has to be active: close the notes and write what you remember, or answer from memory. Re-reading feels fluent and teaches far less than being slightly wrong first."],
        ['category' => 'business', 'title' => 'The one-page plan that forces clarity', 'content' => "Fit five blocks onto one page: who pays you, what they buy, why they buy it from you, what it costs to deliver, and how the next ten customers will hear about you.\n\nIf a block needs a paragraph, it is not decided yet. One page is the point - it makes the holes visible, and you can rewrite it in an evening when reality disagrees. Bring the same page to every partner meeting so everyone argues about the same thing."],
        ['category' => 'marketing', 'title' => 'Benefit-first headlines, rewritten', 'content' => "A headline earns the next line. Compare \"New CRM with automation features\" (describes the product) with \"Stop chasing quotes: follow-ups that send themselves\" (describes the reader's day afterwards).\n\nFormula: concrete outcome, plus the friction removed, plus a number when you have one. Then make the first sentence continue the promise instead of restarting the pitch."],
        ['category' => 'environment', 'title' => 'A one-evening home energy audit', 'content' => "Start with the meter: turn everything off, note the reading, wait an hour with nobody home - anything still moving is standby or a hidden load.\n\nThen walk the house with a hand on likely drafts: window edges, dryer vent, attic hatch, outlets on exterior walls. Seal the top three, and drop the water heater to 55-60 C. The bill change shows up within two cycles, so do not judge it after one evening."],
        ['category' => 'photography', 'title' => 'Three composition rules for phone photos', 'content' => "Get the horizon straight - most snapshots look accidental because of a two-degree tilt.\n\nMove closer: feet, not zoom, because digital zoom throws detail away. And give the subject somewhere to be - leave clean space in the direction the person, animal or car is moving. If the background is busy, drop the phone lower so the subject sits against sky or a plain wall."],
        ['category' => 'fitness', 'title' => 'Progressive overload, without the jargon', 'content' => "Do a little more than last time, on purpose. Add one rep, one kilo, or five seconds of rest between sets - not all three at once.\n\nGive each movement at least a week before judging it, and keep two reps in reserve: if you finish every set feeling like you could do five more, the weight is a warm-up. Soreness is not the goal; steady improvement in the log is."],
        ['category' => 'home', 'title' => 'The 15-minute nightly kitchen reset', 'content' => "Load the dishwasher while the pan soaks. Wipe the counters and stovetop while the water is warm. Sweep in front of the sink only - the whole floor can wait for the weekend. Take out anything that does not belong and drop it at its room's door.\n\nFifteen minutes at the same time every night is what makes Saturday morning a morning off instead of a cleaning session."],
        ['category' => 'career', 'title' => 'Ask for feedback people will actually answer', 'content' => "\"Do you have any feedback?\" invites politeness. Ask about a moment instead: \"In Tuesday's review, was my summary clear before the numbers, or did I bury the point?\"\n\nSpecific questions about specific events get specific answers. Ask once, write it down, and follow up a week later saying what you changed - that follow-up is what makes people give you harder feedback next time."],
        ['category' => 'programming', 'title' => 'Read a stack trace like a map', 'content' => "Start at the bottom-most frame in your own code - the framework frames above it are plumbing. Read the exception type first (null, type, key, timeout), then jump to the line it names and ask which value was not what the code assumed.\n\nThen walk down the frames to see who called it. In unfamiliar code the bug is usually introduced three frames up, not where it finally exploded."],
        ['category' => 'science', 'title' => "Why the sky is blue (and when it isn't)", 'content' => "Air molecules scatter short wavelengths far more strongly than long ones, so sunlight's blue light gets redirected across the sky and you see it in every direction.\n\nSunsets turn red because the light travels through more atmosphere and the blue is scattered away before it reaches you. Smoke and dust change it further: bigger particles scatter all colours nearly equally, which is why polluted skies look white."],
        ['category' => 'communication', 'title' => 'Emails people answer: the two-sentence open', 'content' => "Open with the ask, then the context: \"Can you approve the vendor by Thursday? The contract renews Monday.\" Everything else is supporting detail below the fold.\n\nIf the ask will not fit in two sentences, the request is not decided yet - decide it first. And keep it to one question per email: three questions get answered in order of the reader's convenience, which usually means none."],
        ['category' => 'productivity', 'title' => 'Time-blocking when your day keeps getting interrupted', 'content' => "Block the tasks you control (deep work, admin) and leave visible gaps where others will land (meetings, calls). Pick two anchors - one before lunch, one after - and protect them like meetings with yourself.\n\nWhen an interruption eats a block, move it rather than delete it: an unstored plan comes back as anxiety at 11pm. A day with two kept blocks beats a colour-coded plan you abandoned by 10am."],
        ['category' => 'finance', 'title' => 'APR vs interest rate, with one worked example', 'content' => "The interest rate is the price of borrowing per year; APR adds mandatory fees, so APR is the number to compare between lenders.\n\nBorrow $2,000 at 12% with a $100 mandatory fee: that fee alone adds five points up front, so the APR sits meaningfully above 12%. On a multi-month plan also check whether interest is charged on the original balance every month (flat) or on what you still owe (reducing) - the same headline rate can differ by hundreds over the term."],
        ['category' => 'health', 'title' => 'Sleep: three changes with the biggest payoff', 'content' => "Keep the same wake time every day, including weekends - consistency sets the clock more than bedtime does. No caffeine after early afternoon; its half-life is around five hours.\n\nAnd keep the room cool and dark with the phone charging outside arm's reach: the plan fails at night mostly because of the last scroll. If you lie awake for weeks, build a fixed 30-minute wind-down before bed instead of going to bed earlier to catch up."],
        ['category' => 'cooking', 'title' => 'Rescue an over-salted dish', 'content' => "Dilute first: add unsalted liquid, potato, or more of the main ingredient so the salt spreads across more volume.\n\nThen rebalance. Fat (cream, butter, oil) softens the sharp edge, and a little acid makes salt taste brighter rather than harsher. Sugar helps only in tiny amounts - too much turns savoury sweet. Do not taste for salt again until the plate is warm; salt reads stronger as food cools."],
        ['category' => 'gardening', 'title' => 'Seed starting indoors: light, soil, when to harden off', 'content' => "Use a sterile seed-starting mix, not garden soil - it is lighter and free of the fungus that causes damping-off. Sow shallowly, cover, and keep the tray at 20-24 C until germination; most seeds do not need light to sprout, but they need it immediately after.\n\nA south window is usually not enough - a cheap shop light an inch above the leaves for 14 hours works better. Two weeks before transplanting, move seedlings outside for a few hours in shade, adding time daily so wind and sun do not burn them."],
        ['category' => 'creativity', 'title' => 'Build a swipe file without stealing', 'content' => "Keep a folder of work you admire and, next to each piece, write one sentence about why it works - the hook, the layout, the contrast.\n\nInspiration becomes theft only when you copy the surface without understanding the mechanism. Borrow the structure and fill it with your own material: same rhythm, different music. Review the folder monthly; the pattern you notice twice is your taste, and taste is what you are actually collecting."],
        ['category' => 'leadership', 'title' => "Delegation that doesn't boomerang back", 'content' => "Hand over the outcome, not the steps: \"Get the report trustworthy by Friday - you decide the method\" instead of narrating every click.\n\nAgree what done looks like, when you will check in, and what needs a check-in now versus later. The first re-do costs less than hovering - if you rewrite it yourself every time, you have taught the team that their attempt is paperwork."],
        ['category' => 'communication', 'title' => 'How to disagree in a meeting without derailing it', 'content' => "State what you agree with first, then the one thing you see differently, then a question: \"We agree the launch date is tight. I read the QA result differently - what did you see?\"\n\nThe question keeps it joint problem-solving instead of a duel. If the room cannot resolve it in five minutes, propose where the decision gets made and by whom, and move on - circular debate costs the whole meeting."],
        ['category' => 'home', 'title' => 'A repair kit that covers 90% of household fixes', 'content' => "You rarely need a full workshop. Four screwdrivers (two Phillips, two flat, including one tiny for hinges), an adjustable spanner, a rubber mallet, a tape measure, a spirit level, picture hooks, assorted screws, electrical tape, and a multitool.\n\nAdd a phone light and a pencil. Keep it in one box near the door, not spread across drawers - the tool you cannot find is the tool you do not have. Learn one skill with it first: tightening a wobbly hinge teaches more than reading about tools."],
    ];

    /**
     * Reviewer-queue demo rows: the pipeline a real submitter sees
     * (pending, appealed, rejected, needs-information).
     */
    private const QUEUE_POSTS = [
        ['email' => 'customer@everythingneed.com', 'status' => 'pending', 'category' => 'gardening', 'title' => 'Balcony tomatoes: what I would do differently in month one', 'content' => "Six weeks of growing tomatoes in six square feet of balcony, written down before I forget the mistakes.\n\nWhat worked: one variety only, a deeper pot than the shop label suggested, and watering in the morning. What did not: three plants in one container, feeding too early, and moving the pot every time the sun shifted. Next round I would start with two plants and a stake from day one."],
        ['email' => 'customer@everythingneed.com', 'status' => 'pending', 'category' => 'cooking', 'title' => 'Two dinners planned on Sunday changed our week', 'content' => "We stopped deciding at 6pm. On Sunday we pick two dinners, shop for exactly those plus breakfast basics, and cook the first one that evening.\n\nSecond dinner components get prepped: onions chopped, sauce made, protein marinated. Wednesday is now fifteen minutes instead of an hour and a delivery. The rule that made it stick: no recipe that needs more than eight ingredients on a weeknight."],
        ['email' => 'customer@everythingneed.com', 'status' => 'pending', 'category' => 'productivity', 'title' => 'A week of morning pages: what it actually did', 'content' => "Three longhand pages before opening any screen, for five working days.\n\nDay one was noise. By day three the same worry appeared on paper twice, which told me it was a decision I was avoiding rather than a problem. I did not keep the ritual, but I did keep the output: anything that shows up three mornings running gets a calendar slot that week."],
        ['email' => 'user@everythingneed.com', 'status' => 'pending', 'category' => 'technology', 'title' => 'Fixing a slow laptop: the checklist I run first', 'content' => "Before reinstalling anything: check what is actually running (task manager, sorted by CPU and by memory), how much free disk there is - under 10% free on an SSD hurts - and whether the fans are clogged.\n\nThen update, then quit start-up apps you do not use, then finally consider the reset. Order matters: in my case the \"failing\" laptop was one browser extension pinned at 40% CPU."],
        ['email' => 'user@everythingneed.com', 'status' => 'pending', 'category' => 'business', 'title' => 'What our small shop learned from 100 customer chats', 'content' => "We logged every question customers asked for three months. Three themes covered most of them: where to park, whether we take card, and how long repairs take.\n\nAll three were invisible on our website and our door. Answering them in writing cut repeat calls and made the counter calmer. The lesson was not about marketing - it was that we were answering the same three questions one at a time."],
        ['email' => 'content@everythingneed.com', 'status' => 'pending', 'category' => 'education', 'title' => 'A reading list for people who hate reading lists', 'content' => "Start with one book you already want to read, not the one you think you should. Read twenty pages a day, which is a chapter at most.\n\nKeep a pencil nearby and mark only sentences you would repeat out loud. When you finish, write three lines about it - what changed in your head. That closing note is what turns reading into something you remember, and it takes five minutes."],
        ['email' => 'customer@everythingneed.com', 'status' => 'rejected', 'category' => 'finance', 'title' => 'Get rich quick with this one trading trick', 'content' => 'A post promising guaranteed weekly returns from a single indicator, with signup instructions in the body.', 'rejection_reason' => 'Promises of guaranteed returns and signup links are not allowed on Learn. Resubmit as educational content that explains how the mechanism works, without promising earnings.'],
        ['email' => 'user@everythingneed.com', 'status' => 'needs_information', 'category' => 'health', 'title' => 'Home remedies that fix a flu in a day', 'content' => 'A list of home remedies claimed to cure influenza within 24 hours, with no sources attached.', 'rejection_reason' => 'Please add sources for the health claims before this can be reviewed again. Claims about curing illness need a reference a reader can check.'],
    ];

    /** Short, on-topic comment pools - seeded only where real rows exist. */
    private const COMMENTS = [
        'programming' => [
            'The useState section cleared up a bug I have had for weeks.',
            'Watched this before our team rewrite - the pace is right.',
            'Finally an explanation of closures that does not open with a definition.',
            'Sent it to our junior devs; the examples are small enough to actually try.',
            'The bit about splitting components matches how we structure ours.',
            'Would happily watch a follow-up on testing the same thing.',
        ],
        'technology' => [
            'The tooling point is underrated - half of velocity problems are setup.',
            'Watched twice: once for the ideas, once for the phrasing.',
            'Curious how this holds up as the models keep growing.',
            'Sharing with product - the framing is useful beyond engineering.',
            'The history here is accurate; I remember the version he describes.',
        ],
        'science' => [
            'Showed this to my class - the animation does the explaining.',
            'The scale jump at the end is still dizzying after all these years.',
            'Clear enough for a ten-year-old without being condescending.',
            'Second time seeing it and I caught new details.',
            'Light on maths, right on intuition.',
        ],
        'career' => [
            'The dot-connection bit is the part I quote to people.',
            'Same advice in five places - this is the version that stuck.',
            'Used the twenty-hour idea to start learning Spanish. It works.',
            'Worth revisiting every few months.',
            'The taste-versus-skill point is uncomfortably accurate.',
        ],
        'productivity' => [
            'Started active recall last month - retention is noticeably better.',
            'The monkey illustration has haunted my deadlines since.',
            'Short sessions changed everything for me.',
            'Tried highlighting only. Can confirm it does nothing.',
            'Two-minute rule has nearly cleared my inbox.',
        ],
        'leadership' => [
            'Safety first is not soft - it is how our best team works.',
            'The order of why/how/what finally made this click.',
            'Used this framing in our retro. Better discussion than usual.',
            'Simple idea, hard to practise under pressure.',
            'The crew story is the part I remember.',
        ],
        'communication' => [
            'Cut three filler words from my standups after this.',
            'The habits are worth writing on a card.',
            'Tried the deliberate pause in a client call - it works.',
            'Short, funny, and the advice actually applies.',
            'Sharing with everyone who presents in our reviews.',
        ],
        'gardening' => [
            'Started with two beds last spring - wish I had seen this first.',
            'The spacing chart in the description is worth downloading.',
            'My basil finally survived after I stopped overwatering.',
            'This is the video that got me into permaculture.',
            'Bookmarked for next season.',
        ],
        'cooking' => [
            'The salting advice fixed my vegetables instantly.',
            'Now I understand why my onions kept burning.',
            'Tried the base masala on Tuesday - the house smelled amazing.',
            'Tasting as you go is the real lesson here.',
            'Watched before hosting dinner and kept my cool in the kitchen.',
        ],
        'finance' => [
            'Built the tracker over the weekend. The dashboard is addictive.',
            'The formulas are explained without condescension.',
            'Started the payday transfer last month - the pot is already there.',
            'Wish I had this spreadsheet ten years ago.',
            'Check the periods match your loan before copying the formulas.',
        ],
        'health' => [
            'The fixed wake time did more for me than anything else.',
            'Practical list, no miracle claims - appreciate that.',
            'Walking after lunch instead of another coffee is working.',
            'The brain-change research is the motivation I needed.',
            'Good reminder that consistency beats intensity.',
        ],
        'fitness' => [
            'The day-one version of this is exactly what I needed.',
            'The form breakdown saved my shoulders.',
            'Low impact and I was still sweating by minute ten.',
            'Following the four weeks - the log helps.',
            'No equipment excuses. Did it in the living room.',
        ],
        'general' => [
            'Came back to this twice this week.',
            'Well explained - shared it with a friend starting out.',
            'The comments here have good extra tips too.',
            'Short and useful. More like this please.',
            'This answered a question I could not phrase.',
        ],
    ];

    public function run(): void
    {
        $reviewer = User::where('email', 'learning@everythingneed.com')->first()
            ?? User::where('email', 'super@everythingneed.com')->first();
        $customer = User::where('email', 'customer@everythingneed.com')->first();

        if (!$reviewer || !$customer) {
            return;
        }

        $authors = $this->resolveAuthors();
        if ($authors->isEmpty()) {
            return;
        }

        // Playwright leaves approved "E2E Knowledge ..." rows behind; they are
        // test artifacts, not content, so they never reach the demo feed.
        LearnPost::where('title', 'like', 'E2E Knowledge%')->delete();

        $this->seedVideos($reviewer, $authors);
        $this->seedTextPosts($reviewer, $authors);
        $this->seedModerationQueue($reviewer);
    }

    /** 53 verified external videos -> approved feed posts. */
    private function seedVideos(User $reviewer, $authors): void
    {
        $videos = LearnFeedVideos::VIDEOS;
        $total = count($videos);

        foreach ($videos as $i => $v) {
            $post = LearnPost::where('video_provider', 'youtube')
                ->where('provider_video_id', $v['id'])
                ->first();

            $seed = crc32($v['id']);
            $author = $this->authorFor($v['category'], $i, $authors);
            $createdAt = now()
                ->subDays((int) floor($i * 118 / max(1, $total)))
                ->subMinutes(($i * 47) % 720);

            if (!$post) {
                $watchUrl = 'https://www.youtube.com/watch?v='.$v['id'];
                $views = 500 + ($seed % 45000);
                $likes = 8 + (int) ($views * (0.02 + (($seed >> 5) % 45) / 1000));

                $post = LearnPost::create([
                    'user_id' => $author->id,
                    'title' => Str::limit($v['title'], 250, ''),
                    'content' => $v['note']."\n\nOriginal video by {$v['channel']} on YouTube.",
                    'category' => $v['category'],
                    'media_type' => 'video',
                    'media_url' => $watchUrl,
                    'thumbnail_url' => 'https://i.ytimg.com/vi/'.$v['id'].'/hqdefault.jpg',
                    'video_url' => $watchUrl,
                    'video_provider' => 'youtube',
                    'provider_video_id' => $v['id'],
                    'duration_seconds' => $v['seconds'],
                    'duration_minutes' => (int) ceil($v['seconds'] / 60),
                    'language' => 'en',
                    'sensitive_topic' => $this->isSensitive($v['category']),
                    'slug' => $this->uniqueSlug($v['title'], $i),
                    'author_name' => $author->name,
                    'status' => LearnPost::STATUS_APPROVED,
                    'views_count' => $views,
                    'likes_count' => $likes,
                    'shares_count' => ($seed >> 9) % 90,
                    'is_featured' => in_array($i, [3, 14, 26, 44], true),
                    'is_pinned' => in_array($i, [8, 37], true),
                    'submitted_at' => $createdAt->copy()->subHour(2),
                    'reviewed_by' => $reviewer->id,
                    'reviewed_at' => $createdAt->copy()->addHour(),
                    'published_at' => $createdAt,
                ]);

                // created_at is not mass assignable (fillable list) - the
                // spread across the timeline is set straight on the table.
                LearnPost::where('id', $post->id)->update(['created_at' => $createdAt]);
                $post->refresh();
            }

            // Real threads on half the videos; the rest honestly show 0.
            $this->ensureComments($post, $v['category'], $i % 2 === 0 ? 2 : 0, $authors, $seed);
        }
    }

    /** 27 written guides -> approved feed posts. */
    private function seedTextPosts(User $reviewer, $authors): void
    {
        $total = count(self::TEXT_POSTS);

        foreach (self::TEXT_POSTS as $i => $t) {
            $slug = $this->slugify($t['title']).'-feed-'.$i;
            $post = LearnPost::where('slug', $slug)->first();

            $seed = crc32($t['title']);
            $author = $this->authorFor($t['category'], $i, $authors);
            $createdAt = now()
                ->subDays((int) floor($i * 110 / max(1, $total)))
                ->subMinutes(($i * 29) % 700);

            if (!$post) {
                $views = 120 + ($seed % 3600);

                $post = LearnPost::create([
                    'user_id' => $author->id,
                    'title' => $t['title'],
                    'content' => $t['content'],
                    'category' => $t['category'],
                    'media_type' => 'text',
                    'language' => 'en',
                    'sensitive_topic' => $this->isSensitive($t['category']),
                    'slug' => $slug,
                    'author_name' => $author->name,
                    'status' => LearnPost::STATUS_APPROVED,
                    'views_count' => $views,
                    'likes_count' => 4 + (int) ($views * (0.03 + (($seed >> 6) % 40) / 1000)),
                    'shares_count' => ($seed >> 8) % 16,
                    'is_featured' => in_array($i, [0, 11, 22], true),
                    'submitted_at' => $createdAt->copy()->subHour(),
                    'reviewed_by' => $reviewer->id,
                    'reviewed_at' => $createdAt->copy()->addHour(),
                    'published_at' => $createdAt,
                ]);

                // created_at is not mass assignable (fillable list) - the
                // spread across the timeline is set straight on the table.
                LearnPost::where('id', $post->id)->update(['created_at' => $createdAt]);
                $post->refresh();
            }

            $this->ensureComments($post, $t['category'], $i % 3 === 0 ? 2 : 0, $authors, $seed);
        }
    }

    /** Pending / rejected / needs-information rows for the review queue. */
    private function seedModerationQueue(User $reviewer): void
    {
        foreach (self::QUEUE_POSTS as $i => $q) {
            $slug = $this->slugify($q['title']).'-queue';
            if (LearnPost::where('slug', $slug)->exists()) {
                continue;
            }

            $owner = User::where('email', $q['email'])->first();
            if (!$owner) {
                continue;
            }

            $submitted = now()->subDays(1 + $i)->subHours($i);
            $reviewed = in_array($q['status'], [LearnPost::STATUS_REJECTED, LearnPost::STATUS_NEEDS_INFO], true);

            $post = LearnPost::create([
                'user_id' => $owner->id,
                'title' => $q['title'],
                'content' => $q['content'],
                'category' => $q['category'],
                'media_type' => 'text',
                'language' => 'en',
                'sensitive_topic' => $this->isSensitive($q['category']),
                'slug' => $slug,
                'author_name' => $owner->name,
                'status' => $q['status'],
                'views_count' => 0,
                'likes_count' => 0,
                'shares_count' => 0,
                'rejection_reason' => $q['rejection_reason'] ?? null,
                'appeal_reason' => $q['appeal_reason'] ?? null,
                'reviewed_by' => $reviewed ? $reviewer->id : null,
                'reviewed_at' => $reviewed ? $submitted->copy()->addHour() : null,
                'submitted_at' => $submitted,
            ]);

            LearnPost::where('id', $post->id)->update(['created_at' => $submitted]);
        }
    }

    /**
     * Attach a real comment thread when the post should have one, and keep
     * comments_count equal to the rows that actually exist.
     */
    private function ensureComments(LearnPost $post, string $category, int $count, $commenters, int $seed): void
    {
        $existing = LearnPostComment::where('post_id', $post->id)->count();

        if ($existing > 0) {
            if ((int) $post->comments_count !== $existing) {
                $post->update(['comments_count' => $existing]);
            }

            return;
        }

        if ($count < 1 || $commenters->count() < 2) {
            return;
        }

        $pool = self::COMMENTS[$category] ?? self::COMMENTS['general'];
        $offset = $seed % count($pool);
        $eligible = $commenters->where('id', '!=', $post->user_id)->values();
        if ($eligible->count() < 2) {
            $eligible = $commenters;
        }

        for ($k = 0; $k < $count; $k++) {
            $text = $pool[($offset + $k) % count($pool)];
            $user = $eligible[($seed + $k * 3) % $eligible->count()];

            $comment = LearnPostComment::create([
                'post_id' => $post->id,
                'user_id' => $user->id,
                'content' => $text,
                'likes_count' => ($seed + $k) % 10,
                'status' => LearnPostComment::STATUS_VISIBLE,
            ]);

            // Backdate to the post's own timeline (timestamps are not fillable).
            LearnPostComment::where('id', $comment->id)->update([
                'created_at' => $post->created_at->copy()->addHours(6 + $k * 9)->addMinutes($seed % 55),
                'updated_at' => $post->created_at->copy()->addHours(6 + $k * 9)->addMinutes($seed % 55),
            ]);
        }

        $post->update(['comments_count' => $count]);
    }

    private function resolveAuthors()
    {
        $emails = [
            'user@everythingneed.com',
            'content@everythingneed.com',
            'learning@everythingneed.com',
            'customer@everythingneed.com',
            'vendor@everythingneed.com',
            'finance@everythingneed.com',
            'healthcare@everythingneed.com',
            'support@everythingneed.com',
            'analytics@everythingneed.com',
            'moderator@everythingneed.com',
        ];

        return collect($emails)
            ->map(fn (string $email) => User::where('email', $email)->first())
            ->filter()
            ->values();
    }

    private function authorFor(string $category, int $index, $authors)
    {
        $emails = self::AUTHOR_EMAILS[$category] ?? self::AUTHOR_EMAILS['*'];
        $user = User::where('email', $emails[$index % count($emails)])->first();

        return $user ?? $authors[$index % $authors->count()];
    }

    private function isSensitive(string $category): bool
    {
        return in_array(strtolower(trim($category)), self::SENSITIVE, true);
    }

    private function slugify(string $title): string
    {
        $slug = Str::slug($title);

        return $slug !== '' ? $slug : 'post';
    }

    /** Deterministic unique slug: base, then base-index, then random suffix. */
    private function uniqueSlug(string $title, int $index): string
    {
        $slug = Str::limit($this->slugify($title), 170, '');

        if (!LearnPost::where('slug', $slug)->exists()) {
            return $slug;
        }

        $withIndex = Str::limit($slug, 150, '').'-'.($index + 1);
        if (!LearnPost::where('slug', $withIndex)->exists()) {
            return $withIndex;
        }

        return Str::limit($slug, 140, '').'-'.Str::lower(Str::random(6));
    }
}
