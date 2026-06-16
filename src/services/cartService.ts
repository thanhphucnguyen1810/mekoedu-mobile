// src/services/cartServiceApi.ts

import { api } from "./api";
import authService from "./authService";
import userService from "./userService";

const CART_API = "/o/headless-commerce-delivery-cart/v1.0";

export interface AddCartItemPayload {
  skuId: number;
  quantity: number;
}

class CartServiceApi {
  private getBasicAuthHeader() {
    return {
      Authorization: `Basic ${authService.getBasicAuth()}`,
    };
  }

  private getBasicAuthConfig() {
    return {
      headers: this.getBasicAuthHeader(),
    };
  }

  async createCart(accountId: number, channelId: number) {
    console.log("createCart -> accountId", accountId, "channelId", channelId);

    const res = await api.post(
      `${CART_API}/channels/${channelId}/carts`,
      {
        accountId,
        currencyCode: "USD",
      },
      this.getBasicAuthConfig(),
    );

    return res.data;
  }

  async getCarts(accountId: number, channelId: number) {
    const res = await api.get(
      `${CART_API}/channels/${channelId}/account/${accountId}/carts`,
      {
        params: {
          page: 1,
          pageSize: 20,
        },
        headers: this.getBasicAuthHeader(),
      },
    );

    return res.data;
  }

  async getOrCreateCart(accountId: number, channelId: number) {
    try {
      const cartsData = await this.getCarts(accountId, channelId);
      const carts = cartsData?.items ?? [];

      if (carts.length > 0) {
        return carts[0];
      }
    } catch (error: any) {
      console.log(
        "getCarts failed, fallback to createCart ->",
        error?.response?.status,
        error?.config?.url,
        error?.response?.data,
      );
    }

    return await this.createCart(accountId, channelId);
  }

  async getCartById(cartId: number) {
    const res = await api.get(`${CART_API}/carts/${cartId}`, {
      headers: this.getBasicAuthHeader(),
    });

    return res.data;
  }

  async getCartItems(cartId: number) {
    const res = await api.get(`${CART_API}/carts/${cartId}/items`, {
      params: {
        page: 1,
        pageSize: 100,
      },
      headers: this.getBasicAuthHeader(),
    });

    return res.data;
  }

  async addItemToCart(
    accountId: number,
    channelId: number,
    payload: AddCartItemPayload,
  ) {
    const cart = await this.getOrCreateCart(accountId, channelId);

    const res = await api.post(
      `${CART_API}/carts/${cart.id}/items`,
      {
        skuId: payload.skuId,
        quantity: payload.quantity,
      },
      this.getBasicAuthConfig(),
    );

    return res.data;
  }

  async updateCartItem(cartItemId: number, quantity: number) {
    const res = await api.patch(
      `${CART_API}/cart-items/${cartItemId}`,
      {
        quantity,
      },
      this.getBasicAuthConfig(),
    );

    return res.data;
  }

  async deleteCartItem(cartItemId: number) {
    await api.delete(`${CART_API}/cart-items/${cartItemId}`, {
      headers: this.getBasicAuthHeader(),
    });

    return true;
  }

  async deleteCart(cartId: number) {
    await api.delete(`${CART_API}/carts/${cartId}`, {
      headers: this.getBasicAuthHeader(),
    });

    return true;
  }

  async getCartCount(accountId: number, channelId: number): Promise<number> {
    const cart = await this.getOrCreateCart(accountId, channelId);
    const itemsData = await this.getCartItems(cart.id);

    return (itemsData.items ?? []).reduce(
      (total: number, item: any) => total + (item.quantity ?? 1),
      0,
    );
  }

  async getCartQuantity(channelId: number): Promise<number> {
    const accountId = await userService.getCurrentAccountId();
    const cart = await this.getOrCreateCart(Number(accountId), channelId);
    const itemsData = await this.getCartItems(cart.id);
    return itemsData.items?.length ?? 0;
  }
}

export default new CartServiceApi();
