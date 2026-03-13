import type { ListingDTO, CreateListingInput } from "./listing.model";
import { createListingSchema, searchListingsSchema } from "./listing.validator";
import * as listingRepo from "./listing.repository";
import { notify } from "../notification/notification.service";

type ListingWithSeller = Awaited<ReturnType<typeof listingRepo.findListingById>>;

export function toDTO(listing: NonNullable<ListingWithSeller>): ListingDTO {
  const pricePerUnit = listing.pricePerUnit;
  const totalPrice = pricePerUnit * BigInt(listing.quantity);

  return {
    id: listing.id,
    sellerId: listing.sellerId,
    sellerName: listing.seller.displayName,
    type: listing.type as ListingDTO["type"],
    itemId: listing.itemId,
    itemName: listing.itemName,
    quantity: listing.quantity,
    pricePerUnit: pricePerUnit.toString(),
    totalPrice: totalPrice.toString(),
    status: listing.status as ListingDTO["status"],
    expiresAt: listing.expiresAt?.toISOString() ?? null,
    createdAt: listing.createdAt.toISOString(),
  };
}

export async function createListing(
  sellerId: string,
  input: CreateListingInput
): Promise<ListingDTO> {
  const parsed = createListingSchema.parse(input);

  const listing = await listingRepo.createListing({
    sellerId,
    type: parsed.type,
    itemId: parsed.itemId,
    itemName: parsed.itemName,
    quantity: parsed.quantity,
    pricePerUnit: BigInt(parsed.pricePerUnit),
  });

  return toDTO(listing);
}

export async function searchListings(
  options?: { type?: string; search?: string; limit?: number; offset?: number }
): Promise<ListingDTO[]> {
  const parsed = searchListingsSchema.parse(options || {});
  const listings = await listingRepo.findActiveListings(parsed);
  return listings.map(toDTO);
}

export async function getListingById(id: string): Promise<ListingDTO | null> {
  const listing = await listingRepo.findListingById(id);
  return listing ? toDTO(listing) : null;
}

export async function getMyListings(sellerId: string): Promise<ListingDTO[]> {
  const listings = await listingRepo.findListingsBySeller(sellerId);
  return listings.map(toDTO);
}

export async function cancelListing(
  userId: string,
  listingId: string
): Promise<ListingDTO> {
  const listing = await listingRepo.findListingById(listingId);
  if (!listing) throw new Error("Listing not found");
  if (listing.sellerId !== userId) throw new Error("Not your listing");
  if (listing.status !== "active") throw new Error("Listing is not active");

  const updated = await listingRepo.updateListingStatus(listingId, "cancelled");
  return toDTO(updated);
}

/**
 * Buy a listing:
 * 1. Verify listing is active
 * 2. Verify buyer is not the seller
 * 3. Debit buyer's wallet (totalPrice)
 * 4. Credit seller's wallet
 * 5. Mark listing as sold
 */
export async function buyListing(
  buyerId: string,
  listingId: string
): Promise<ListingDTO> {
  const listing = await listingRepo.findListingById(listingId);
  if (!listing) throw new Error("Listing not found");
  if (listing.status !== "active") throw new Error("Listing is not active");
  if (listing.sellerId === buyerId) throw new Error("Cannot buy your own listing");

  const totalPrice = listing.pricePerUnit * BigInt(listing.quantity);

  // Atomic: debit buyer, credit seller, mark sold — all or nothing
  const updated = await listingRepo.atomicBuyListing(
    listingId,
    buyerId,
    listing.sellerId,
    totalPrice,
    listing.itemName,
    listing.quantity
  );

  // Fire-and-forget notifications
  const totalStr = `$${totalPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  notify({
    userId: listing.sellerId,
    type: "listing_sold",
    title: "Item Sold!",
    message: `Your ${listing.itemName} x${listing.quantity} was purchased for ${totalStr}`,
    referenceId: listingId,
  }).catch(() => {});

  notify({
    userId: buyerId,
    type: "listing_purchased",
    title: "Purchase Complete",
    message: `You bought ${listing.itemName} x${listing.quantity} for ${totalStr}`,
    referenceId: listingId,
  }).catch(() => {});

  return toDTO(updated);
}

/**
 * Expire listings past their expiresAt date.
 * Returns the count of expired listings.
 */
export async function expireListings(): Promise<number> {
  const result = await listingRepo.expireListings();
  return result.count;
}
