import React, {
    useEffect,
    useState,
    useCallback,
    useMemo,
    useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
    Container,
    Header,
    ScrollContainer,
    FoodsContainer,
    Food,
    FoodImageContainer,
    FoodContent,
    FoodTitle,
    FoodDescription,
    FoodPricing,
    AdditionalsContainer,
    Title,
    TotalContainer,
    AdittionalItem,
    AdittionalItemText,
    AdittionalQuantity,
    PriceButtonContainer,
    TotalPrice,
    QuantityContainer,
    FinishOrderButton,
    ButtonText,
    IconContainer,
} from './styles';

interface Params {
    id: number;
}

interface Extra {
    id: number;
    name: string;
    value: number;
    quantity: number;
}

interface Food {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    formattedPrice: string;
    extras: Extra[];
}

interface Favorite {
    id: number;
}

const FoodDetails: React.FC = () => {
    const [food, setFood] = useState({} as Food);
    const [extras, setExtras] = useState<Extra[]>([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [foodQuantity, setFoodQuantity] = useState(1);

    const navigation = useNavigation();
    const route = useRoute();

    const routeParams = route.params as Params;

    useEffect(() => {
        async function loadFood(): Promise<void> {
            // Load a specific food with extras based on routeParams id
            const response = await api.get<Food>(`foods/${routeParams.id}`);
            setFood({
                ...response.data,
                formattedPrice: formatValue(response.data.price),
            });
            setExtras(
                response.data.extras.map(extra => ({ ...extra, quantity: 0 })),
            );

            const responseFav = await api.get<Favorite[]>(`favorites`);
            const find = responseFav.data.find(
                favorite => favorite.id === food.id,
            );
            setIsFavorite(!!find);
        }

        loadFood();
    }, [food.id, routeParams]);

    function handleIncrementExtra(id: number): void {
        const extraToIncrement = extras.find(extra => extra.id === id);
        if (extraToIncrement) {
            extraToIncrement.quantity += 1;
            setExtras([...extras]);
        }
    }

    function handleDecrementExtra(id: number): void {
        const extraToDecrement = extras.find(extra => extra.id === id);
        if (extraToDecrement && extraToDecrement.quantity > 0) {
            extraToDecrement.quantity -= 1;
            setExtras([...extras]);
        }
    }

    function handleIncrementFood(): void {
        // Increment food quantity
        setFoodQuantity(foodQuantity + 1);
    }

    function handleDecrementFood(): void {
        if (foodQuantity > 1) {
            setFoodQuantity(foodQuantity - 1);
        }
    }

    const toggleFavorite = useCallback(async () => {
        if (!isFavorite) {
            await api.post('favorites', food);
        } else {
            await api.delete(`favorites/${food.id}`);
        }
        setIsFavorite(!isFavorite);
    }, [isFavorite, food]);

    const cartTotal = useMemo(() => {
        // Calculate cartTotal
        const sumExtras = extras
            .map(extra => extra.value * extra.quantity)
            .reduce((prev, curr) => {
                return prev + curr;
            }, 0);

        const subtotal = (Number(food.price) + sumExtras) * foodQuantity;
        const total = formatValue(subtotal);
        return total;
    }, [extras, food, foodQuantity]);

    async function handleFinishOrder(): Promise<void> {
        const order = { ...food, extras };
        await api.post('orders', order);
    }

    // Calculate the correct icon name
    const favoriteIconName = useMemo(
        () => (isFavorite ? 'favorite' : 'favorite-border'),
        [isFavorite],
    );

    useLayoutEffect(() => {
        // Add the favorite icon on the right of the header bar
        navigation.setOptions({
            headerRight: () => (
                <MaterialIcon
                    name={favoriteIconName}
                    size={24}
                    color="#FFB84D"
                    onPress={() => toggleFavorite()}
                />
            ),
        });
    }, [navigation, favoriteIconName, toggleFavorite]);

    return (
        <Container>
            <Header />

            <ScrollContainer>
                <FoodsContainer>
                    <Food>
                        <FoodImageContainer>
                            <Image
                                style={{ width: 327, height: 183 }}
                                source={{
                                    uri: food.image_url,
                                }}
                            />
                        </FoodImageContainer>
                        <FoodContent>
                            <FoodTitle>{food.name}</FoodTitle>
                            <FoodDescription>
                                {food.description}
                            </FoodDescription>
                            <FoodPricing>{food.formattedPrice}</FoodPricing>
                        </FoodContent>
                    </Food>
                </FoodsContainer>
                <AdditionalsContainer>
                    <Title>Adicionais</Title>
                    {extras.map(extra => (
                        <AdittionalItem key={extra.id}>
                            <AdittionalItemText>
                                {extra.name}
                            </AdittionalItemText>
                            <AdittionalQuantity>
                                <Icon
                                    size={15}
                                    color="#6C6C80"
                                    name="minus"
                                    onPress={() =>
                                        handleDecrementExtra(extra.id)
                                    }
                                    testID={`decrement-extra-${extra.id}`}
                                />
                                <AdittionalItemText
                                    testID={`extra-quantity-${extra.id}`}
                                >
                                    {extra.quantity}
                                </AdittionalItemText>
                                <Icon
                                    size={15}
                                    color="#6C6C80"
                                    name="plus"
                                    onPress={() =>
                                        handleIncrementExtra(extra.id)}
                                    testID={`increment-extra-${extra.id}`}
                                />
                            </AdittionalQuantity>
                        </AdittionalItem>
                    ))}
                </AdditionalsContainer>
                <TotalContainer>
                    <Title>Total do pedido</Title>
                    <PriceButtonContainer>
                        <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
                        <QuantityContainer>
                            <Icon
                                size={15}
                                color="#6C6C80"
                                name="minus"
                                onPress={handleDecrementFood}
                                testID="decrement-food"
                            />
                            <AdittionalItemText testID="food-quantity">
                                {foodQuantity}
                            </AdittionalItemText>
                            <Icon
                                size={15}
                                color="#6C6C80"
                                name="plus"
                                onPress={handleIncrementFood}
                                testID="increment-food"
                            />
                        </QuantityContainer>
                    </PriceButtonContainer>

                    <FinishOrderButton onPress={() => handleFinishOrder()}>
                        <ButtonText>Confirmar pedido</ButtonText>
                        <IconContainer>
                            <Icon name="check-square" size={24} color="#fff" />
                        </IconContainer>
                    </FinishOrderButton>
                </TotalContainer>
            </ScrollContainer>
        </Container>
    );
};

export default FoodDetails;
