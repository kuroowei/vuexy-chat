import { Post } from '../models/Post';
import { Wallet } from '../models/Wallet';
import { VideoEarning } from '../models/VideoEarning';

// Sample rates, chosen to roughly match real-world Nigerian programmatic
// video ad CPMs — transparent and easy to adjust later, not arbitrary.
export const MIN_ELIGIBLE_VIEWS = 100;
export const RATE_PER_1000_VIEWS_NGN = 500;

/**
 * Scans every video post, and for any post that has crossed the eligibility
 * threshold with new views since it was last paid out, credits the author's
 * wallet and records a VideoEarning ledger entry. Safe to run repeatedly —
 * each post only ever gets paid for views it hasn't been paid for yet.
 */
export async function calculateVideoEarnings() {
  const videoPosts = await Post.find({ videoUrl: { $exists: true, $ne: null } });
  let processed = 0;

  for (const post of videoPosts) {
    if (post.views < MIN_ELIGIBLE_VIEWS) continue; // not yet eligible at all

    const newViews = post.views - post.lastEarningsCalculatedViews;
    if (newViews <= 0) continue; // already paid for every view so far

    const amount = Math.round((newViews / 1000) * RATE_PER_1000_VIEWS_NGN * 100) / 100;
    const periodStart = post.lastEarningsCalculatedAt;
    const periodEnd = new Date();

    await VideoEarning.create({
      postId: post._id,
      userId: post.authorId,
      periodStart,
      periodEnd,
      viewsCounted: newViews,
      amount,
    });

    post.lastEarningsCalculatedViews = post.views;
    post.lastEarningsCalculatedAt = periodEnd;
    await post.save();

    await Wallet.findOneAndUpdate(
      { userId: post.authorId },
      { $inc: { balance: amount, totalEarned: amount } },
      { upsert: true, new: true }
    );

    processed += 1;
  }

  return { processed };
}
