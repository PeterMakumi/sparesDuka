import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useEffect, useReducer } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { getError } from '../../../utils/error';
import Layout from '../../../components/Layout';
import Link from 'next/link';
import { toast } from 'react-toastify';

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, error: '' };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };

    case 'UPDATE_REQUEST':
      return { ...state, loadingUpdate: true, errorUpdate: '' };
    case 'UPDATE_SUCCESS':
      return { ...state, loadingUpdate: false, errorUpdate: '' };
    case 'UPDATE_FAIL':
      return { ...state, loadingUpdate: false, errorUpdate: action.payload };
    case 'UPLOAD_REQUEST':
      return { ...state, loadingUpload: true, errorUpload: '' };
    case 'UPLOAD_SUCCESS':
      return {
        ...state,
        loadingUpload: false,
        errorUpload: '',
      };
    case 'UPLOAD_FAIL':
      return { ...state, loadingUpload: false, errorUpload: action.payload };
    default:
      return state;
  }
}

export default function AdminProductEditScreen() {
  const { query } = useRouter();
  const productId = query.id;
  const [{ loading, error, loadingUpdate, loadingUpload }, dispatch] =
    useReducer(reducer, {
      loading: true,
      error: '',
    });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      compatibleVehicles: [{ make: '', model: '', year: '' }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'compatibleVehicles',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: 'FETCH_REQUEST' });
        const { data } = await axios.get(`/api/admin/products/${productId}`);
        dispatch({ type: 'FETCH_SUCCESS' });
        setValue('name', data.name);
        setValue('slug', data.slug);
        setValue('price', data.price);
        setValue('image', data.image);
        setValue('category', data.category);
        setValue('brand', data.brand);
        setValue('countInStock', data.countInStock);
        setValue('description', data.description);
        setValue(
          'compatibleVehicles',
          data.compatibleVehicles.length == 0
            ? [{ make: 'All makes', model: 'All models', year: 'All Years' }]
            : data.compatibleVehicles
        );
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
      }
    };

    fetchData();
  }, [productId, setValue]);

  const router = useRouter();

  const uploadHandler = async (e, imageField = 'image') => {
    e.preventDefault();
    const url = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`;
    try {
      dispatch({ type: 'UPLOAD_REQUEST' });
      const {
        data: { signature, timestamp },
      } = await axios('/api/admin/cloudinary-sign');

      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY);
      const { data } = await axios.post(url, formData);
      dispatch({ type: 'UPLOAD_SUCCESS' });
      setValue(imageField, data.secure_url);
      toast.success('File uploaded successfully');
    } catch (err) {
      dispatch({ type: 'UPLOAD_FAIL', payload: getError(err) });
      toast.error(getError(err));
    }

    // uploading to local storage /public/images
    // e.preventDefault();
    // try {
    //   dispatch({ type: 'UPLOAD_REQUEST' });

    //   const file = e.target.files[0];
    //   const formData = new FormData();
    //   console.log(file.name);

    //   formData.append('file', file);
    //   const config = {
    //     headers: {
    //       'Content-Type': 'multipart/form-data',
    //     },
    //   };

    //   const response = await axios.post(
    //     '/api/admin/products/upload',
    //     formData,
    //     config
    //   );

    //   if (response.data.message === 'File uploaded successfully') {
    //     const imageUrl = `/images/${file.name}`;
    //     dispatch({ type: 'UPLOAD_SUCCESS' });
    //     setValue(imageField, imageUrl);
    //     toast.success('File uploaded successfully');
    //   }
    // } catch (err) {
    //   dispatch({ type: 'UPLOAD_FAIL', payload: getError(err) });
    //   toast.error(getError(err));
    // }
  };

  const submitHandler = async ({
    name,
    slug,
    price,
    category,
    image,
    brand,
    countInStock,
    description,
    compatibleVehicles,
  }) => {
    try {
      dispatch({ type: 'UPDATE_REQUEST' });
      await axios.put(`/api/admin/products/${productId}`, {
        name,
        slug,
        price,
        category,
        image,
        brand,
        countInStock,
        description,
        compatibleVehicles,
      });
      dispatch({ type: 'UPDATE_SUCCESS' });
      toast.success('Product updated successfully');
      router.push('/admin/products');
    } catch (err) {
      dispatch({ type: 'UPDATE_FAIL', payload: getError(err) });
      toast.error(getError(err));
    }
  };

  return (
    <Layout title={`Edit Product ${productId}`}>
      <div className="grid md:grid-cols-4 md:gap-5">
        <div>
          <ul>
            <li>
              <Link id="link" href="/admin/dashboard">
                Dashboard
              </Link>
            </li>
            <li>
              <Link id="link" href="/admin/orders">
                Orders
              </Link>
            </li>
            <li>
              <Link id="link" className="font-bold" href="/admin/products">
                Products
              </Link>
            </li>
            <li>
              <Link id="link" href="/admin/users">
                Users
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3">
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="alert-error">{error}</div>
          ) : (
            <form
              className="mx-auto max-w-screen-md"
              onSubmit={handleSubmit(submitHandler)}
            >
              <h1 className="mb-4 text-xl">{`Edit Product ${productId}`}</h1>
              <div className="mb-4">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  className="w-full"
                  id="name"
                  autoFocus
                  {...register('name', {
                    required: 'Please enter product name',
                  })}
                />
                {errors.name && (
                  <div className="text-red-500">{errors.name.message}</div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="slug">Slug</label>
                <input
                  type="text"
                  className="w-full"
                  id="slug"
                  {...register('slug', {
                    required: 'Please enter slug',
                  })}
                />
                {errors.slug && (
                  <div className="text-red-500">{errors.slug.message}</div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="price">Price</label>
                <input
                  type="text"
                  className="w-full"
                  id="price"
                  {...register('price', {
                    required: 'Please enter price',
                  })}
                />
                {errors.price && (
                  <div className="text-red-500">{errors.price.message}</div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="image">image</label>
                <input
                  type="text"
                  className="w-full"
                  id="image"
                  {...register('image', {
                    required: 'Please enter image',
                  })}
                />
                {errors.image && (
                  <div className="text-red-500">{errors.image.message}</div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="imageFile">Upload Image</label>
                <input
                  type="file"
                  className="w-full"
                  id="imageFile"
                  onChange={uploadHandler}
                />
                {loadingUpload && <div>Uploading...</div>}
              </div>
              <div className="mb-4">
                <label htmlFor="category">Category</label>
                <select
                  type="text"
                  className="w-full"
                  id="category"
                  {...register('category', {
                    required: 'Please enter category',
                  })}
                >
                  {'Select a category '}
                  <option value="">Select Category</option>
                  <option value="Chassis">Chassis</option>
                  <option value="Engine">Engine</option>
                  <option value="Transmission">Transmission</option>
                  <option value="Body">Body</option>
                  <option value="Suspension">Suspension</option>
                  <option value="Brakes">Brakes</option>
                  <option value="Electrical system">Electrical system</option>
                  <option value="Exhaust system">Exhaust system</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Wheels and Tyres">Wheels and Tyres</option>
                </select>
                {errors.category && (
                  <div className="text-red-500">{errors.category.message}</div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="brand">Brand</label>
                <input
                  type="text"
                  className="w-full"
                  id="brand"
                  {...register('brand', {
                    required: 'Please enter brand',
                  })}
                />
                {errors.brand && (
                  <div className="text-red-500">{errors.brand.message}</div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="countInStock">CountInStock</label>
                <input
                  type="text"
                  className="w-full"
                  id="countInStock"
                  {...register('countInStock', {
                    required: 'Please enter countInStock',
                  })}
                />
                {errors.countInStock && (
                  <div className="text-red-500">
                    {errors.countInStock.message}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  className="w-full"
                  id="description"
                  {...register('description', {
                    required: 'Please enter description',
                  })}
                />
                {errors.description && (
                  <div className="text-red-500">
                    {errors.description.message}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="compatibleVehicles">Compatible Vehicles</label>
                {fields.map((item, index) => (
                  <div key={item.id} className="flex mb-2 space-x-2">
                    <input
                      placeholder="Make e.g. Toyota"
                      {...register(`compatibleVehicles.${index}.make`)}
                      defaultValue={item.make}
                      className="w-full px-2 py-1 border rounded-md"
                    />
                    <input
                      placeholder="Model e.g. Prado"
                      {...register(`compatibleVehicles.${index}.model`)}
                      defaultValue={item.model}
                      className="w-full px-2 py-1 border rounded-md"
                    />
                    <input
                      placeholder="Year e.g. 2005, 2006"
                      {...register(`compatibleVehicles.${index}.year`)}
                      defaultValue={item.year}
                      className="w-full px-2 py-1 border rounded-md"
                    />
                    <button
                      className="px-2 py-1 text-white bg-red-500 rounded-md hover:bg-red-600"
                      type="button"
                      onClick={() => remove(index)}
                    >
                      Remove
                    </button>
                    <button
                      className="px-2 py-1 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                      type="button"
                      onClick={() => append({ make: '', model: '', year: '' })}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <button disabled={loadingUpdate} className="primary-button">
                  {loadingUpdate ? 'Loading' : 'Update'}
                </button>
              </div>
              <div className="mb-4">
                <Link id="link" href={`/admin/products`}>
                  Back
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}

AdminProductEditScreen.auth = { adminOnly: true };
