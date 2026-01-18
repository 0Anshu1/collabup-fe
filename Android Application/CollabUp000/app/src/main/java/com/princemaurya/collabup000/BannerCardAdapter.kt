package com.princemaurya.collabup000

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import androidx.cardview.widget.CardView
import com.google.android.material.button.MaterialButton
import android.view.animation.AnimationUtils
import android.view.animation.Animation

class BannerCardAdapter(private var updates: List<UpdateCard>) : RecyclerView.Adapter<BannerCardAdapter.BannerViewHolder>() {
    class BannerViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val title: TextView = itemView.findViewById(R.id.update_title)
        val description: TextView = itemView.findViewById(R.id.update_description)
        val image: ImageView = itemView.findViewById(R.id.update_image)
        val cardBackground: CardView = itemView.findViewById(R.id.card_background)
        val ctaButton: MaterialButton = itemView.findViewById(R.id.cta_button)
        val urgencyBadge: TextView = itemView.findViewById(R.id.urgency_badge)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BannerViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_update_card, parent, false)
        return BannerViewHolder(view)
    }

    override fun onBindViewHolder(holder: BannerViewHolder, position: Int) {
        val update = updates[position]
        
        holder.title.text = update.title
        holder.description.text = update.description
        holder.image.setImageResource(update.imageRes)
        
        // Set different gradient backgrounds based on card type
        val gradientBackground = when (position) {
            0 -> R.drawable.bg_card_gradient_1  // Hackathon - Red to Cyan
            1 -> R.drawable.bg_card_gradient_2  // Internship - Orange to Pink
            2 -> R.drawable.bg_card_gradient_3  // Research - Green to Blue
            3 -> R.drawable.bg_card_gradient_4  // Startup - Purple to Pink
            else -> R.drawable.bg_card_gradient_1
        }
        
        holder.cardBackground.setCardBackgroundColor(holder.itemView.context.getColor(android.R.color.transparent))
        holder.cardBackground.background = holder.itemView.context.getDrawable(gradientBackground)
        
        // Set different icon colors based on card type
        val iconColor = when (position) {
            0 -> holder.itemView.context.getColor(R.color.error_red)  // Red for hackathon
            1 -> holder.itemView.context.getColor(R.color.chip_orange)  // Orange for internship
            2 -> holder.itemView.context.getColor(R.color.chip_green)  // Green for research
            3 -> holder.itemView.context.getColor(R.color.chip_purple)  // Purple for startup
            else -> holder.itemView.context.getColor(R.color.primary_blue)
        }
        holder.image.setColorFilter(iconColor)
        
        // Set different CTA button text and styling based on card type
        val ctaText = when (position) {
            0 -> "Register Now"
            1 -> "Apply Now"
            2 -> "Join Research"
            3 -> "Join Team"
            else -> "Learn More"
        }
        holder.ctaButton.text = ctaText
        
        // Set different button colors based on card type
        val buttonColor = when (position) {
            0 -> holder.itemView.context.getColor(R.color.error_red)
            1 -> holder.itemView.context.getColor(R.color.chip_orange)
            2 -> holder.itemView.context.getColor(R.color.chip_green)
            3 -> holder.itemView.context.getColor(R.color.chip_purple)
            else -> holder.itemView.context.getColor(R.color.primary_blue)
        }
        holder.ctaButton.strokeColor = android.content.res.ColorStateList.valueOf(buttonColor)
        
        // Show different badges for different cards
        when (position) {
            0 -> {
                holder.urgencyBadge.visibility = View.VISIBLE
                holder.urgencyBadge.text = "🔥 HOT"
                holder.urgencyBadge.setBackgroundResource(R.drawable.bg_urgency_badge)
            }
            1 -> {
                holder.urgencyBadge.visibility = View.VISIBLE
                holder.urgencyBadge.text = "💰 PAID"
                holder.urgencyBadge.setBackgroundResource(R.drawable.bg_badge_paid)
            }
            2 -> {
                holder.urgencyBadge.visibility = View.VISIBLE
                holder.urgencyBadge.text = "🔬 RESEARCH"
                holder.urgencyBadge.setBackgroundResource(R.drawable.bg_badge_research)
            }
            3 -> {
                holder.urgencyBadge.visibility = View.VISIBLE
                holder.urgencyBadge.text = "💡 STARTUP"
                holder.urgencyBadge.setBackgroundResource(R.drawable.bg_badge_startup)
            }
            else -> {
                holder.urgencyBadge.visibility = View.GONE
            }
        }
        
        // Add entrance animation
        val entranceAnimation = AnimationUtils.loadAnimation(holder.itemView.context, R.anim.card_entrance)
        entranceAnimation.startOffset = (position * 100).toLong() // Shorter delay for ViewPager2
        holder.itemView.startAnimation(entranceAnimation)
        
        // Add click animation
        holder.itemView.setOnClickListener {
            val clickAnimation = AnimationUtils.loadAnimation(holder.itemView.context, R.anim.card_click)
            holder.itemView.startAnimation(clickAnimation)
            
            // Add bounce back animation
            clickAnimation.setAnimationListener(object : Animation.AnimationListener {
                override fun onAnimationStart(animation: Animation?) {}
                override fun onAnimationEnd(animation: Animation?) {
                    val bounceBack = AnimationUtils.loadAnimation(holder.itemView.context, android.R.anim.fade_in)
                    bounceBack.duration = 150
                    holder.itemView.startAnimation(bounceBack)
                }
                override fun onAnimationRepeat(animation: Animation?) {}
            })
        }
    }

    override fun getItemCount(): Int = updates.size

    fun updateData(newUpdates: List<UpdateCard>) {
        updates = newUpdates
        notifyDataSetChanged()
    }
} 