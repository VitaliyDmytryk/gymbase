class StreetFood {
  constructor(data) {
    this.id = data.id;
    this.food_name = data.food_name;
    this.country = data.country;
    this.spicy_level = data.spicy_level;
    this.price = data.price;
    this.rating = data.rating;
    this.image_url = data.image_url;
    this.user_id = data.user_id;
    this.created_at = data.created_at;
  }

  get formattedPrice() {
    if (this.price === null || this.price === undefined) return '—';
    return `$${Number(this.price).toFixed(2)}`;
  }

  get formattedDate() {
    if (!this.created_at) return '';
    return new Intl.DateTimeFormat('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(this.created_at));
  }

  toJSON() {
    return {
      id: this.id,
      food_name: this.food_name,
      country: this.country,
      spicy_level: this.spicy_level,
      price: this.formattedPrice,
      rating: this.rating,
      image_url: this.image_url,
      created_at: this.formattedDate
    };
  }
}

export default StreetFood;