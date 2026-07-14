// Generated via `generate_typescript_types` against the live project (ztxlivzacnzemrbqqbby).
// Re-run and paste over the Database type below whenever the schema changes.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	__InternalSupabase: {
		PostgrestVersion: '14.5';
	};
	public: {
		Tables: {
			email_logs: {
				Row: {
					id: string;
					recipient: string;
					subject: string;
					type: string;
					html_content: string;
					status: string;
					error_message: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					recipient: string;
					subject: string;
					type: string;
					html_content: string;
					status?: string;
					error_message?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					recipient?: string;
					subject?: string;
					type?: string;
					html_content?: string;
					status?: string;
					error_message?: string | null;
					created_at?: string;
				};
				Relationships: [];
			};
			addresses: {
				Row: {
					address_line: string;
					address_line1?: string;
					address_line2?: string | null;
					city: string | null;
					created_at: string;
					customer_id?: string;
					full_name?: string;
					id: string;
					is_default: boolean;
					label: string;
					landmark?: string | null;
					name: string;
					phone: string;
					pincode: string | null;
					state: string | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					address_line: string;
					address_line1?: string;
					address_line2?: string | null;
					city?: string | null;
					created_at?: string;
					customer_id?: string;
					full_name?: string;
					id?: string;
					is_default?: boolean;
					label?: string;
					landmark?: string | null;
					name: string;
					phone: string;
					pincode?: string | null;
					state?: string | null;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					address_line?: string;
					address_line1?: string;
					address_line2?: string | null;
					city?: string | null;
					created_at?: string;
					customer_id?: string;
					full_name?: string;
					id?: string;
					is_default?: boolean;
					label?: string;
					landmark?: string | null;
					name?: string;
					phone?: string;
					pincode?: string | null;
					state?: string | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [];
			};
			banners: {
				Row: {
					active: boolean;
					created_at: string;
					id: string;
					image_url: string | null;
					link_url: string | null;
					sort_order: number;
					subtitle: string | null;
					title: string | null;
				};
				Insert: {
					active?: boolean;
					created_at?: string;
					id?: string;
					image_url?: string | null;
					link_url?: string | null;
					sort_order?: number;
					subtitle?: string | null;
					title?: string | null;
				};
				Update: {
					active?: boolean;
					created_at?: string;
					id?: string;
					image_url?: string | null;
					link_url?: string | null;
					sort_order?: number;
					subtitle?: string | null;
					title?: string | null;
				};
				Relationships: [];
			};
			categories: {
				Row: {
					created_at: string;
					icon: string | null;
					id: string;
					name: string;
					slug: string;
					sort_order: number;
					subtitle: string | null;
				};
				Insert: {
					created_at?: string;
					icon?: string | null;
					id?: string;
					name: string;
					slug: string;
					sort_order?: number;
					subtitle?: string | null;
				};
				Update: {
					created_at?: string;
					icon?: string | null;
					id?: string;
					name?: string;
					slug?: string;
					sort_order?: number;
					subtitle?: string | null;
				};
				Relationships: [];
			};
			carts: {
				Row: {
					created_at: string;
					customer_id: string;
					id: string;
				};
				Insert: {
					created_at?: string;
					customer_id: string;
					id?: string;
				};
				Update: {
					created_at?: string;
					customer_id?: string;
					id?: string;
				};
				Relationships: [];
			};
			cart_items: {
				Row: {
					cart_id: string;
					id: string;
					product_id: string;
					quantity: number;
				};
				Insert: {
					cart_id: string;
					id?: string;
					product_id: string;
					quantity: number;
				};
				Update: {
					cart_id?: string;
					id?: string;
					product_id?: string;
					quantity?: number;
				};
				Relationships: [];
			};
			order_items: {
				Row: {
					id: string;
					order_id: string;
					price: number;
					product_id: string | null;
					product_name: string;
					qty: number;
					quantity?: number;
					variant_size: string | null;
				};
				Insert: {
					id?: string;
					order_id: string;
					price: number;
					product_id?: string | null;
					product_name: string;
					qty: number;
					quantity?: number;
					variant_size?: string | null;
				};
				Update: {
					id?: string;
					order_id?: string;
					price?: number;
					product_id?: string | null;
					product_name?: string;
					qty?: number;
					quantity?: number;
					variant_size?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'order_items_order_id_fkey';
						columns: ['order_id'];
						isOneToOne: false;
						referencedRelation: 'orders';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'order_items_product_id_fkey';
						columns: ['product_id'];
						isOneToOne: false;
						referencedRelation: 'products';
						referencedColumns: ['id'];
					}
				];
			};
			orders: {
				Row: {
					address_id?: string | null;
					created_at: string;
					customer_address: string;
					customer_id?: string | null;
					customer_name: string;
					customer_phone: string;
					id: string;
					notes: string | null;
					status: string;
					total: number;
					total_amount?: number;
					updated_at: string;
					user_id: string | null;
				};
				Insert: {
					address_id?: string | null;
					created_at?: string;
					customer_address: string;
					customer_id?: string | null;
					customer_name: string;
					customer_phone: string;
					id?: string;
					notes?: string | null;
					status?: string;
					total: number;
					total_amount?: number;
					updated_at?: string;
					user_id?: string | null;
				};
				Update: {
					address_id?: string | null;
					created_at?: string;
					customer_address?: string;
					customer_id?: string | null;
					customer_name?: string;
					customer_phone?: string;
					id?: string;
					notes?: string | null;
					status?: string;
					total?: number;
					total_amount?: number;
					updated_at?: string;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'orders_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			product_images: {
				Row: {
					id: string;
					product_id: string;
					sort_order: number;
					url: string;
				};
				Insert: {
					id?: string;
					product_id: string;
					sort_order?: number;
					url: string;
				};
				Update: {
					id?: string;
					product_id?: string;
					sort_order?: number;
					url?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'product_images_product_id_fkey';
						columns: ['product_id'];
						isOneToOne: false;
						referencedRelation: 'products';
						referencedColumns: ['id'];
					}
				];
			};
			product_variants: {
				Row: {
					id: string;
					price: number;
					product_id: string;
					size: string;
					sort_order: number;
					stock: number;
				};
				Insert: {
					id?: string;
					price: number;
					product_id: string;
					size: string;
					sort_order?: number;
					stock?: number;
				};
				Update: {
					id?: string;
					price?: number;
					product_id?: string;
					size?: string;
					sort_order?: number;
					stock?: number;
				};
				Relationships: [
					{
						foreignKeyName: 'product_variants_product_id_fkey';
						columns: ['product_id'];
						isOneToOne: false;
						referencedRelation: 'products';
						referencedColumns: ['id'];
					}
				];
			};
			products: {
				Row: {
					benefits: string | null;
					care_note: string | null;
					category_id: string;
					created_at: string;
					description: string | null;
					eyebrow: string | null;
					id: string;
					image_url?: string | null;
					ingredients: string | null;
					is_active?: boolean;
					name: string;
					price?: number;
					slug: string;
					sort_order: number;
					status: string;
					stock?: number;
					updated_at: string;
					usage?: string | null;
					usage_instructions: string | null;
				};
				Insert: {
					benefits?: string | null;
					care_note?: string | null;
					category_id: string;
					created_at?: string;
					description?: string | null;
					eyebrow?: string | null;
					id?: string;
					image_url?: string | null;
					ingredients?: string | null;
					is_active?: boolean;
					name: string;
					price?: number;
					slug: string;
					sort_order?: number;
					status?: string;
					stock?: number;
					updated_at?: string;
					usage?: string | null;
					usage_instructions?: string | null;
				};
				Update: {
					benefits?: string | null;
					care_note?: string | null;
					category_id?: string;
					created_at?: string;
					description?: string | null;
					eyebrow?: string | null;
					id?: string;
					image_url?: string | null;
					ingredients?: string | null;
					is_active?: boolean;
					name?: string;
					price?: number;
					slug?: string;
					sort_order?: number;
					status?: string;
					stock?: number;
					updated_at?: string;
					usage?: string | null;
					usage_instructions?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'products_category_id_fkey';
						columns: ['category_id'];
						isOneToOne: false;
						referencedRelation: 'categories';
						referencedColumns: ['id'];
					}
				];
			};
			profiles: {
				Row: {
					created_at: string;
					email: string;
					full_name?: string | null;
					id: string;
					name: string | null;
					phone?: string | null;
					mobile_number?: string | null;
					role: string;
				};
				Insert: {
					created_at?: string;
					email: string;
					full_name?: string | null;
					id: string;
					name?: string | null;
					phone?: string | null;
					mobile_number?: string | null;
					role?: string;
				};
				Update: {
					created_at?: string;
					email?: string;
					full_name?: string | null;
					id?: string;
					name?: string | null;
					phone?: string | null;
					mobile_number?: string | null;
					role?: string;
				};
				Relationships: [];
			};
			settings: {
				Row: {
					business_address: string | null;
					business_email: string | null;
					business_phone: string | null;
					footer_text: string | null;
					id: boolean;
					instagram_url: string | null;
					updated_at: string;
					whatsapp_channel_url: string | null;
					whatsapp_number: string | null;
				};
				Insert: {
					business_address?: string | null;
					business_email?: string | null;
					business_phone?: string | null;
					footer_text?: string | null;
					id?: boolean;
					instagram_url?: string | null;
					updated_at?: string;
					whatsapp_channel_url?: string | null;
					whatsapp_number?: string | null;
				};
				Update: {
					business_address?: string | null;
					business_email?: string | null;
					business_phone?: string | null;
					footer_text?: string | null;
					id?: boolean;
					instagram_url?: string | null;
					updated_at?: string;
					whatsapp_channel_url?: string | null;
					whatsapp_number?: string | null;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			is_admin: { Args: never; Returns: boolean };
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type PublicSchema = Database['public'];

export type ProductStatus = 'available' | 'out_of_stock' | 'coming_soon' | 'hidden' | 'discontinued';
export type OrderStatus =
	| 'pending'
	| 'processing'
	| 'confirmed'
	| 'packed'
	| 'shipped'
	| 'delivered'
	| 'cancelled';
export type UserRole = 'customer' | 'admin';

export type Product = PublicSchema['Tables']['products']['Row'];
export type ProductImage = PublicSchema['Tables']['product_images']['Row'];
export type ProductVariant = PublicSchema['Tables']['product_variants']['Row'];
export type Category = PublicSchema['Tables']['categories']['Row'];
export type Profile = PublicSchema['Tables']['profiles']['Row'];
export type Order = PublicSchema['Tables']['orders']['Row'];
export type OrderItem = PublicSchema['Tables']['order_items']['Row'];
export type Settings = PublicSchema['Tables']['settings']['Row'];
export type Banner = PublicSchema['Tables']['banners']['Row'];
export type Address = PublicSchema['Tables']['addresses']['Row'];

export type ProductWithRelations = Product & {
	product_images: ProductImage[];
	product_variants: ProductVariant[];
	categories: Pick<Category, 'slug' | 'name'>;
};
