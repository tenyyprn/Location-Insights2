import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem
} from '../ui';

interface FormData {
  propertyType: string;
  address: string;
  size: string;
  price: string;
  estimatedRent: string;
  buildingAge: string;
  description: string;
}

interface FormErrors {
  [key: string]: string;
}

interface PropertyFormProps {
  onSubmit?: (data: FormData) => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    propertyType: 'apartment',
    address: '',
    size: '',
    price: '',
    estimatedRent: '',
    buildingAge: '',
    description: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // リアルタイムバリデーション
    validateField(name, value);
  };

  const validateField = (name: string, value: string) => {
    let newErrors = { ...errors };

    switch (name) {
      case 'size':
        if (!value || isNaN(Number(value)) || Number(value) <= 0) {
          newErrors[name] = '有効な面積を入力してください';
        } else {
          delete newErrors[name];
        }
        break;
      case 'price':
        if (!value || isNaN(Number(value)) || Number(value) <= 0) {
          newErrors[name] = '有効な価格を入力してください';
        } else {
          delete newErrors[name];
        }
        break;
      case 'address':
        if (!value.trim()) {
          newErrors[name] = '住所を入力してください';
        } else {
          delete newErrors[name];
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length === 0) {
      console.log('Form submitted:', formData);
      // 外部から渡されたonSubmit関数があれば呼び出す
      if (onSubmit) {
        onSubmit(formData);
      }
      // ここで実際の送信処理
    }
  };

  const handlePropertyTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, propertyType: value }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800">
      <Card className="bg-card">
        <CardHeader className="bg-card">
          <CardTitle className="text-xl font-bold text-center">物件情報登録</CardTitle>
          <CardDescription>物件の詳細情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="bg-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="propertyType">物件種別</Label>
              <RadioGroup
                name="propertyType"
                value={formData.propertyType}
                onValueChange={handlePropertyTypeChange}
              >
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="apartment" id="apartment" name="propertyType" />
                    <Label htmlFor="apartment">マンション</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="house" id="house" name="propertyType" />
                    <Label htmlFor="house">一戸建て</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="commercial" id="commercial" name="propertyType" />
                    <Label htmlFor="commercial">商業施設</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">住所</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="東京都渋谷区..."
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">面積 (㎡)</Label>
                <Input
                  id="size"
                  name="size"
                  type="number"
                  value={formData.size}
                  onChange={handleInputChange}
                  placeholder="80"
                  className={errors.size ? 'border-red-500' : ''}
                />
                {errors.size && <p className="text-red-500 text-sm">{errors.size}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">価格 (万円)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="5000"
                  className={errors.price ? 'border-red-500' : ''}
                />
                {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedRent">想定賃料 (万円/月)</Label>
                <Input
                  id="estimatedRent"
                  name="estimatedRent"
                  type="number"
                  value={formData.estimatedRent}
                  onChange={handleInputChange}
                  placeholder="20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildingAge">築年数</Label>
                <Input
                  id="buildingAge"
                  name="buildingAge"
                  type="number"
                  value={formData.buildingAge}
                  onChange={handleInputChange}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">物件説明</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="物件の特徴や魅力を入力してください..."
                className="form-input min-h-[100px] resize-vertical"
                rows={4}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={Object.keys(errors).length > 0}
                className="bg-[#4A90E2] text-white"
              >
                登録する
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export { PropertyForm };
export default PropertyForm;
